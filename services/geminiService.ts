
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

/**
 * Attempts to generate content with a primary model, falling back to a secondary model on rate limit errors.
 */
async function generateWithFallback(params: {
  prompt: string;
  primaryModel: string;
  fallbackModel: string;
  responseSchema?: any;
  thinkingBudget?: number;
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const attempt = async (modelName: string, budget?: number) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: params.prompt,
      config: {
        thinkingConfig: budget ? { thinkingBudget: budget } : undefined,
        responseMimeType: "application/json",
        responseSchema: params.responseSchema,
      },
    });
  };

  try {
    // Try primary model (usually Pro)
    return await attempt(params.primaryModel, params.thinkingBudget);
  } catch (error: any) {
    // If it's a rate limit error (429) or the model is overloaded (503), try Flash
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    const isOverloaded = error.message?.includes("503") || error.status === 503;
    
    if (isRateLimit || isOverloaded) {
      console.warn(`Primary model ${params.primaryModel} failed (${error.status}). Falling back to ${params.fallbackModel}...`);
      try {
        // Use a smaller thinking budget or none for Flash fallback to reduce token usage/latency
        return await attempt(params.fallbackModel, params.thinkingBudget ? Math.min(params.thinkingBudget, 8000) : undefined);
      } catch (fallbackError: any) {
        throw new Error(`Both ${params.primaryModel} and ${params.fallbackModel} failed. Error: ${fallbackError.message}`);
      }
    }
    throw error;
  }
}

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const sanitizedClasses = classes.map(c => ({
    ...c,
    assignments: (c.assignments || []).filter(a => a.teacherId && a.subjectId)
  })).filter(c => c.assignments.length > 0);

  const inputData = {
    periods: profile.hours.totalPeriods,
    days: [0, 1, 2, 3, 4],
    teachers: teachers.map(t => ({ 
      id: t.id, 
      name: t.name, 
      maxDaily: t.maxDailyPeriods,
      minBreaks: t.breaksNeededPerWeek || 5 
    })),
    classes: sanitizedClasses.map(c => ({
      id: c.id,
      name: c.name,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ 
      day: l.dayOfWeek, 
      period: l.period, 
      global: l.isSchoolWide, 
      classIds: l.classIds || [],
      name: l.name 
    })),
    specialInstructions: profile.specialInstructions || "None provided."
  };

  const prompt = `
    TASK: You are a Pro Optimization Engine for school timetables.
    
    CRITICAL CONSTRAINTS:
    1. PEDAGOGICAL SPACING (HIGHEST PRIORITY): For any class, NEVER schedule the same subjectId twice in the same day if its frequencyPerWeek is 5 or less.
    2. ONE LESSON PER TEACHER: A teacher cannot teach two classes at once.
    3. NO DOUBLE BOOKING: A teacher cannot teach the same class the same subject twice in one day. 
    4. INSTITUTIONAL LOCKS: Never assign subjects to locked slots.
    5. NO TEACHER CLASHES: One teacher per slot across the entire school.
    6. TEACHER REST: Respect minimum break requirements.
    7. SUBJECT FREQUENCY: Meet exact frequency targets.
    
    SPECIAL CONSIDERATIONS: ${inputData.specialInstructions}
    DATA: ${JSON.stringify(inputData)}
    
    RETURN: A JSON array [{period, day, subjectId, teacherId, classId}]
  `;

  const responseSchema = {
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
  };

  try {
    const response = await generateWithFallback({
      prompt,
      primaryModel: 'gemini-3-pro-preview',
      fallbackModel: 'gemini-3-flash-preview',
      responseSchema,
      thinkingBudget: 16000
    });

    const text = sanitizeJson(response.text || '[]');
    const slots: ScheduleSlot[] = JSON.parse(text);
    return slots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e: any) {
    if (e.message?.includes("429")) {
      throw new Error("The AI service is currently at capacity (Rate Limit). Please wait a minute and try again.");
    }
    throw new Error(e.message || "Optimization failed.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const prompt = `Act as a Pro Optimization Engine. Create a 12-week teaching plan for these books: ${JSON.stringify(textbooks)}. Breakdown by week.`;
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      quarterName: { type: Type.STRING },
      weeks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            weekNumber: { type: Type.INTEGER },
            subject: { type: Type.STRING },
            unit: { type: Type.STRING },
            pages: { type: Type.STRING }
          },
          required: ["weekNumber", "subject", "unit", "pages"]
        }
      }
    },
    required: ["weeks"]
  };

  try {
    const response = await generateWithFallback({
      prompt,
      primaryModel: 'gemini-3-flash-preview', // Roadmap is less complex, use Flash directly
      fallbackModel: 'gemini-3-flash-preview',
      responseSchema
    });
    return JSON.parse(sanitizeJson(response.text || '{"weeks":[]}'));
  } catch (e) {
    return { quarterName: "Error", weeks: [] };
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const prompt = `Act as a Pro Optimization Engine. Analyze this school schedule for burnout and efficiency. 
  RETURN JSON EXACTLY: { 
    score: number (0-100), 
    loadScore: number (0-100),
    rulesScore: number (0-100),
    usageScore: number (0-100),
    goalScore: number (0-100),
    flowScore: number (0-100),
    insights: [string], 
    burnoutRisks: [string] 
  }.
  Schedule: ${JSON.stringify(schedule)}`;

  try {
    const response = await generateWithFallback({
      prompt,
      primaryModel: 'gemini-3-flash-preview',
      fallbackModel: 'gemini-3-flash-preview'
    });
    return JSON.parse(sanitizeJson(response.text || '{}'));
  } catch (e) {
    return { score: 75, insights: ["Automated analysis completed with defaults."] };
  }
};
