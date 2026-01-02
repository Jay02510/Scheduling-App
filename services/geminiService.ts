import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, FixedClass, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule } from "../types";

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Extract valid IDs for the AI to use
  const validSubjectIds = profile.subjects.map(s => s.id);
  const validTeacherIds = teachers.map(t => t.id);
  const validClassIds = classes.map(c => c.id);

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    lunchPeriod: profile.hours.lunchAfterPeriod,
    teachers: teachers.map(t => ({
      id: t.id,
      maxDaily: t.maxDailyPeriods,
      minBreaks: t.breaksNeededPerWeek
    })),
    classes: classes.map(c => ({
      id: c.id,
      assignments: c.assignments.map(a => ({
        subjectId: a.subjectId,
        frequency: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 0,
        teacherId: a.teacherId
      })).filter(r => r.frequency > 0)
    })),
    locks: fixedClasses.map(f => ({
      day: f.dayOfWeek,
      period: f.period,
      isGlobal: f.isSchoolWide,
      classIds: f.classIds
    }))
  };

  const prompt = `
    TASK: Generate a Weekly Master Schedule for a school.
    
    ENVIRONMENT:
    - Days: 0 (Mon) to 4 (Fri).
    - Periods: 0 to ${inputData.totalPeriods - 1}.
    - LUNCH: Period ${inputData.lunchPeriod} is reserved for lunch for ALL classes.

    STRICT CONSTRAINTS:
    1. Only use these Teacher IDs: ${JSON.stringify(validTeacherIds)}.
    2. Only use these Subject IDs: ${JSON.stringify(validSubjectIds)}.
    3. Only use these Class IDs: ${JSON.stringify(validClassIds)}.
    4. A Teacher cannot be in two places at once (same Day/Period).
    5. Honor the teacher "maxDaily" (max classes per day).
    6. Honor the "locks" (pre-scheduled slots): ${JSON.stringify(inputData.locks)}.
    7. Each class must meet its subject "frequency" per week.

    Input Data: ${JSON.stringify(inputData)}

    Return a JSON array of ScheduleSlot objects with keys: period, day, subjectId, teacherId, classId.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.NUMBER },
            day: { type: Type.NUMBER },
            subjectId: { type: Type.STRING },
            teacherId: { type: Type.STRING },
            classId: { type: Type.STRING }
          },
          required: ["period", "day", "subjectId", "teacherId", "classId"]
        }
      }
    }
  });

  try {
    const rawData = JSON.parse(response.text || '[]');
    // Filter out invalid IDs that the AI might have hallucinated despite instructions
    return rawData.filter((slot: any) => 
      validSubjectIds.includes(slot.subjectId) && 
      validTeacherIds.includes(slot.teacherId) && 
      validClassIds.includes(slot.classId)
    ).map((slot: any) => ({
      ...slot,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    throw new Error("Master Schedule synthesis failed. The model generated invalid JSON.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Generate a 12-week lesson plan roadmap for these books: ${JSON.stringify(textbooks.map(t => ({ title: t.title, pages: t.totalPages, subject: t.subject })))}.
    School profile: ${JSON.stringify(profile.specialEvents)}.
  `;

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
                pages: { type: Type.STRING },
                isHolidayWeek: { type: Type.BOOLEAN }
              },
              required: ["weekNumber", "subject", "unit", "pages"]
            }
          }
        },
        required: ["weeks"]
      }
    }
  });

  return JSON.parse(response.text || '{"weeks":[]}');
};

/**
 * Analyzes the school schedule using Gemini AI to identify burnout risks and efficiency metrics.
 * Required by the AnalyticsDashboard component.
 */
export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Perform a comprehensive audit of the following school schedule.
    Evaluate for teacher burnout, constraint satisfaction, and general pedagogical efficiency.
    
    School Context: ${JSON.stringify(profile)}
    Weekly Slots: ${JSON.stringify(schedule.weeklySlots)}
    Teacher Data: ${JSON.stringify(teachers)}

    Return the analysis in a strictly formatted JSON object.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall quality score from 0 to 100" },
          constraintScore: { type: Type.NUMBER, description: "Rule adherence score from 0 to 100" },
          efficiency: { type: Type.NUMBER, description: "Resource utilization ratio from 0.0 to 1.0" },
          burnoutRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of identified risks for staff" },
          insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General observations and tips" }
        },
        required: ["score", "constraintScore", "efficiency", "burnoutRisks", "insights"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Audit parsing failed", e);
    return {
      score: 50,
      constraintScore: 50,
      efficiency: 0.5,
      burnoutRisks: ["Analysis parsing failed"],
      insights: ["The AI response was invalid."]
    };
  }
};