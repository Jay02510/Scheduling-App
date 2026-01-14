
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
    TASK: Institutional Timetable Optimization Engine.
    
    STRICT SCHEDULING RULES:
    1. UTILIZE ALL AVAILABLE SLOTS: AI must use periods AFTER lunch (${inputData.schoolConfig.lunchAfter}) to meet weekly subject frequencies. Do NOT leave post-lunch slots empty if subject requirements are unmet.
    2. TEACHER CARDINALITY: A teacher can NEVER be in two classes at the same time. Verify teacher overlap at every slot.
    3. CLASS CARDINALITY: A class can only have one subject at a time.
    4. SUBJECT FREQUENCY: Ensure each subject occurs the requested number of times per week.
    
    LOGIC STEPS (CHAIN OF THOUGHT):
    - Identify all available slots (non-locked).
    - Map subjects to available slots across all 5 days.
    - Validate teacher availability for every single assignment.
    
    CONSTRAINTS: ${inputData.specialInstructions}
    
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

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const prompt = `
    TASK: Professional Schedule Audit & Strategic Report.
    DATA: 
    Schedule: ${JSON.stringify(schedule.weeklySlots)}
    Profile: ${JSON.stringify(profile)}
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name, role: t.role, maxDaily: t.maxDailyPeriods })))}
    
    ANALYSIS REQUIREMENTS:
    1. Narrative Summary: Provide a 2-sentence executive summary of the schedule's health.
    2. Quantitative Scores (0-100) for: Load Balance, Rule Adherence, Resource Usage, Curriculum Goals, and Daily Flow.
    3. Burnout detection.
    
    RETURN JSON: {
      "score": number,
      "summary": string,
      "loadScore": number,
      "rulesScore": number,
      "usageScore": number,
      "goalScore": number,
      "flowScore": number,
      "insights": string[],
      "burnoutRisks": string[]
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
          summary: { type: Type.STRING },
          loadScore: { type: Type.NUMBER },
          rulesScore: { type: Type.NUMBER },
          usageScore: { type: Type.NUMBER },
          goalScore: { type: Type.NUMBER },
          flowScore: { type: Type.NUMBER },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          burnoutRisks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "summary", "insights", "burnoutRisks"]
      }
    }
  });

  return JSON.parse(sanitizeJson(response.text || '{}'));
};
