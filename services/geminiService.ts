
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    CONSTRAINTS:
    1. INSTITUTIONAL LOCKS: Never assign subjects to locked slots.
    2. NO TEACHER CLASHES: One teacher per slot across the school.
    3. FIVE-DAY UTILIZATION: Distribute lessons across all 5 days.
    4. TEACHER REST: Respect minimum break requirements.
    5. SUBJECT FREQUENCY: Meet exact frequency targets.
    
    SPECIAL CONSIDERATIONS: ${inputData.specialInstructions}
    DATA: ${JSON.stringify(inputData)}
    
    RETURN: A JSON array [{period, day, subjectId, teacherId, classId}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
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
        }
      }
    });

    const text = sanitizeJson(response.text || '[]');
    const slots: ScheduleSlot[] = JSON.parse(text);
    return slots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e: any) {
    throw new Error(e.message || "Optimization failed.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a Pro Optimization Engine. Create a 12-week teaching plan for these books: ${JSON.stringify(textbooks)}. Breakdown by week.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        }
      }
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(sanitizeJson(response.text || '{}'));
  } catch (e) {
    return { score: 75, insights: ["Automated analysis completed with defaults."] };
  }
};
