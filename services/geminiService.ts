
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const parseStaffList = async (text: string): Promise<Partial<Teacher>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Parse this teacher list into JSON. 
    Terms to watch for: "Homeroom" (homeroom), "Specialist" (specialist), "Subject" (subject).
    Raw Text: "${text}"
    Return JSON array: { name, role }.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING, enum: ['homeroom', 'specialist', 'subject'] }
            },
            required: ["name", "role"]
          }
        }
      }
    });
    return JSON.parse(sanitizeJson(response.text || '[]'));
  } catch (e) {
    console.error("Staff parsing failed", e);
    return [];
  }
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter out any invalid assignments
  const sanitizedClasses = classes.map(c => ({
    ...c,
    assignments: (c.assignments || []).filter(a => a.teacherId && a.subjectId)
  })).filter(c => c.assignments.length > 0);

  const inputData = {
    periods: profile.hours.totalPeriods,
    lunchAfter: profile.hours.lunchAfterPeriod,
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
      name: l.name 
    }))
  };

  const prompt = `
    TASK: You are a Pro Optimization Engine for school timetables.
    
    CONSTRAINTS:
    1. INSTITUTIONAL LOCKS: ${JSON.stringify(inputData.locks.filter(l => l.global))} are BLOCKED for ALL classes.
    2. TEACHER REST: Every teacher MUST have at least their "minBreaks" distributed across the week.
    3. NO CLASHES: A teacher cannot teach two classes in the same period.
    4. SUBJECT FREQUENCY: Each class must meet its subject "freq" per week exactly.
    5. CONTINUITY: Max 3 back-to-back periods for any teacher.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN: A JSON array of scheduled slots.
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
    const slots = JSON.parse(text);
    return slots.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Optimization Engine failed", e);
    throw new Error("Timetable optimization failed. Please check if your assignments are complete.");
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
    console.error("Roadmap optimization failed", e);
    return { quarterName: "Error", weeks: [] };
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a Pro Optimization Engine. Analyze this school schedule for burnout and efficiency. Return JSON { score, insights: [string], burnoutRisks: [string] }.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(sanitizeJson(response.text || '{}'));
  } catch (e) {
    return { score: 0, insights: ["Analysis failed"] };
  }
};
