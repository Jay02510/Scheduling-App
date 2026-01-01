import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile, QuarterlyPlan, ScheduleSlot } from "../types";

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    validSubjectNames: profile.subjects.map(s => s.name),
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      reqs: c.assignments.map(a => {
        const sub = profile.subjects.find(s => s.id === a.subjectId);
        return { subject: sub?.name, freq: sub?.frequencyPerWeek, teacherId: a.teacherId };
      }).filter(r => r.freq && r.freq > 0)
    })),
    locks: fixedClasses.map(f => ({
      day: f.dayOfWeek,
      period: f.period,
      name: f.name,
      isGlobal: f.isSchoolWide,
      classes: f.classIds
    }))
  };

  const prompt = `
    TASK: Generate a Weekly Master Schedule grid (Days 0-4, Periods 0-${inputData.totalPeriods - 1}).
    
    STRICT CONSTRAINTS (MANDATORY):
    1. SUBJECT NAMES: You MUST use the exact subject names provided: ${JSON.stringify(inputData.validSubjectNames)}. DO NOT rename them or use abbreviations.
    2. TEACHER AVAILABILITY: A teacher (teacherId) CANNOT be assigned to more than one class during the same (day, period). Cross-check all teacher schedules to ensure zero overlaps.
    3. LOCKED SLOTS: Do NOT place any lessons in these coordinates as they are reserved: ${JSON.stringify(inputData.locks)}.
    4. ASSIGNMENT QUOTAS: Respect the "freq" (frequency per week) for each subject in each class.
    5. DATA: ${JSON.stringify(inputData.classes)}

    Output should be a flat list of occupied slots.
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
            subject: { type: Type.STRING },
            teacherId: { type: Type.STRING },
            classId: { type: Type.STRING },
            topic: { type: Type.STRING }
          },
          required: ["period", "day", "subject", "teacherId", "classId"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    throw new Error("Master Schedule synthesis failed. The AI model returned an invalid format.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const inputData = {
    books: textbooks.map(t => ({ title: t.title, pages: t.totalPages, subject: t.subject })),
    holidays: profile.specialEvents || []
  };

  const prompt = `
    TASK: Create a 12-week pacing roadmap for textbooks.
    
    RULES:
    1. Distribute book pages across 12 weeks for each subject.
    2. RED DAYS (Holidays): If a week contains a holiday, significantly reduce the page target for that week.
    3. SUBJECTS: Use the exact subject names linked to the books.
    4. DATA: 
       - Books: ${JSON.stringify(inputData.books)}
       - Holidays: ${JSON.stringify(inputData.holidays)}
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
                isHolidayWeek: { type: Type.BOOLEAN },
                holidayName: { type: Type.STRING }
              },
              required: ["weekNumber", "subject", "unit", "pages"]
            }
          }
        },
        required: ["weeks"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"weeks":[]}');
  } catch (e) {
    throw new Error("Curriculum Roadmap synthesis failed.");
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Audit institutional performance: ${JSON.stringify({ profile, schedule })}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          burnoutRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          efficiency: { type: Type.NUMBER },
          constraintScore: { type: Type.NUMBER }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};