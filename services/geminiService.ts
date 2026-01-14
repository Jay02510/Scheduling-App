
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

/**
 * Creates a simple hash of the input data to detect if the schedule needs a new solve.
 */
export const computeInputHash = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Internal helper for AI generation with automatic fallback
async function generateWithFallback(params: {
  prompt: string;
  primaryModel: string;
  fallbackModel: string;
  responseSchema?: any;
  thinkingBudget?: number;
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const attempt = async (modelName: string, budget?: number) => {
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: params.responseSchema,
    };
    
    // Only add thinking budget if supported (Gemini 3 and 2.5 models)
    if (budget !== undefined && (modelName.includes('gemini-3') || modelName.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: budget };
    }

    // Call generateContent with model name and prompt in one go as per guidelines
    return await ai.models.generateContent({
      model: modelName,
      contents: params.prompt,
      config,
    });
  };

  try {
    return await attempt(params.primaryModel, params.thinkingBudget);
  } catch (error: any) {
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    if (isRateLimit) {
      console.warn(`Rate limit on ${params.primaryModel}. Falling back to ${params.fallbackModel}...`);
      return await attempt(params.fallbackModel, undefined); // Flash fallback doesn't need high budget
    }
    throw error;
  }
}

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false
): Promise<ScheduleSlot[]> => {
  const sanitizedClasses = classes.map(c => ({
    ...c,
    assignments: (c.assignments || []).filter(a => a.teacherId && a.subjectId)
  })).filter(c => c.assignments.length > 0);

  const inputData = {
    periods: profile.hours.totalPeriods,
    days: [0, 1, 2, 3, 4],
    teachers: teachers.map(t => ({ id: t.id, name: t.name, maxDaily: t.maxDailyPeriods })),
    classes: sanitizedClasses.map(c => ({
      id: c.id,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ day: l.dayOfWeek, period: l.period, global: l.isSchoolWide, classIds: l.classIds || [] }))
  };

  const prompt = `
    TASK: School Timetable Optimizer.
    CONSTRAINTS: 
    - STRICT: One subject per class per day max (if freq <= 5).
    - No teacher double-booking.
    - Match weekly frequency exactly.
    DATA: ${JSON.stringify(inputData)}
    RETURN JSON: Array<{period, day, subjectId, teacherId, classId}>
  `;

  // Use Flash by default to save 10x cost, use Pro only for "Deep Solve"
  const model = useHighPower ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const budget = useHighPower ? 16000 : 0;

  const response = await generateWithFallback({
    prompt,
    primaryModel: model,
    fallbackModel: 'gemini-3-flash-preview',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.INTEGER },
          day: { type: Type.INTEGER },
          subjectId: { type: Type.STRING },
          teacherId: { type: Type.STRING },
          classId: { type: Type.STRING }
        },
        required: ["period", "day", "subjectId", "teacherId", "classId"]
      }
    },
    thinkingBudget: budget
  });

  const slots: ScheduleSlot[] = JSON.parse(sanitizeJson(response.text || '[]'));
  return slots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
};

export const generateCurriculumRoadmap = async (textbooks: Textbook[]): Promise<QuarterlyPlan> => {
  // Curriculum roadmaps are low-complexity, ALWAYS use Flash.
  const response = await generateWithFallback({
    prompt: `Generate 12-week roadmap for: ${JSON.stringify(textbooks)}`,
    primaryModel: 'gemini-3-flash-preview',
    fallbackModel: 'gemini-3-flash-preview'
  });
  return JSON.parse(sanitizeJson(response.text || '{"weeks":[]}'));
};

/**
 * Uses Gemini to analyze the current schedule for efficiency and potential issues.
 */
export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const prompt = `
    TASK: School Schedule Auditor.
    DATA: 
    Schedule: ${JSON.stringify(schedule.weeklySlots)}
    Profile: ${JSON.stringify(profile)}
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name, role: t.role, maxDaily: t.maxDailyPeriods })))}
    
    Analyze for:
    1. Teacher burnout (exceeding max daily periods).
    2. Rule violations (multiple high-focus subjects in a day).
    3. Efficiency of usage.
    
    RETURN JSON: {
      score: number,
      loadScore: number,
      rulesScore: number,
      usageScore: number,
      goalScore: number,
      flowScore: number,
      insights: string[],
      burnoutRisks: string[]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          loadScore: { type: Type.NUMBER },
          rulesScore: { type: Type.NUMBER },
          usageScore: { type: Type.NUMBER },
          goalScore: { type: Type.NUMBER },
          flowScore: { type: Type.NUMBER },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          burnoutRisks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "insights", "burnoutRisks"]
      }
    }
  });

  return JSON.parse(sanitizeJson(response.text || '{}'));
};
