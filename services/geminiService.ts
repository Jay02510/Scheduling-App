
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

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
    
    if (budget !== undefined && (modelName.includes('gemini-3') || modelName.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: budget };
    }

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
      return await attempt(params.fallbackModel, undefined);
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
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  const sanitizedClasses = classes.map(c => ({
    ...c,
    assignments: (c.assignments || []).filter(a => a.teacherId && a.subjectId)
  })).filter(c => c.assignments.length > 0);

  const inputData = {
    schoolConfig: {
      periods: profile.hours.totalPeriods,
      lunchAfter: profile.hours.lunchAfterPeriod,
      days: [0, 1, 2, 3, 4]
    },
    teachers: teachers.map(t => ({ id: t.id, name: t.name, maxDaily: t.maxDailyPeriods })),
    classes: sanitizedClasses.map(c => ({
      id: c.id,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ day: l.dayOfWeek, period: l.period, global: l.isSchoolWide, classIds: l.classIds || [] })),
    specialInstructions: profile.specialInstructions || "No special constraints."
  };

  const prompt = `
    TASK: School Timetable Optimizer.
    
    CRITICAL PRIORITY:
    1. SPECIAL INSTRUCTIONS (HUMAN CONSTRAINTS): ${inputData.specialInstructions}. 
       Example: If a teacher only teaches "after lunch", DO NOT schedule them in periods 1 to ${inputData.schoolConfig.lunchAfter}.
    2. HARD LOGIC: One subject per class per day max (if frequency <= 5). No teacher double-booking. Match weekly frequency.
    
    SELF-AUDIT:
    If a special instruction cannot be met due to a logic clash, include it in the "issues" array.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN JSON: {
      "slots": Array<{period, day, subjectId, teacherId, classId}>,
      "validation": { "success": boolean, "issues": string[] }
    }
  `;

  const model = useHighPower ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const budget = useHighPower ? 16000 : 0;

  const response = await generateWithFallback({
    prompt,
    primaryModel: model,
    fallbackModel: 'gemini-3-flash-preview',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        slots: {
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
        validation: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["success", "issues"]
        }
      },
      required: ["slots", "validation"]
    },
    thinkingBudget: budget
  });

  const result = JSON.parse(sanitizeJson(response.text || '{"slots":[], "validation":{"success":false,"issues":["AI return error"]}}'));
  return {
    slots: result.slots.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) })),
    validation: result.validation
  };
};

export const generateCurriculumRoadmap = async (textbooks: Textbook[]): Promise<QuarterlyPlan> => {
  const response = await generateWithFallback({
    prompt: `Generate 12-week roadmap for: ${JSON.stringify(textbooks)}`,
    primaryModel: 'gemini-3-flash-preview',
    fallbackModel: 'gemini-3-flash-preview'
  });
  return JSON.parse(sanitizeJson(response.text || '{"weeks":[]}'));
};

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
    1. Teacher burnout.
    2. Special instruction adherence.
    
    RETURN JSON: {
      score: number,
      insights: string[],
      burnoutRisks: string[]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(sanitizeJson(response.text || '{}'));
};
