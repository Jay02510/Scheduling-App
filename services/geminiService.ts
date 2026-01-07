
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

export const parseStaffList = async (text: string): Promise<Partial<Teacher>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Parse this teacher list into JSON. 
    Terms to watch for: "Homeroom" (homeroom), "Specialist" (specialist), "Subject" (subject).
    Raw Text: "${text}"
    Return JSON array: { name, role }.
  `;
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
  return JSON.parse(response.text || '[]');
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const inputData = {
    periods: profile.hours.totalPeriods,
    lunchAfter: profile.hours.lunchAfterPeriod,
    teachers: teachers.map(t => ({ 
      id: t.id, 
      name: t.name, 
      maxDaily: t.maxDailyPeriods,
      minBreaks: t.breaksNeededPerWeek || 5 
    })),
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 0,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ 
      day: l.dayOfWeek, 
      period: l.period, 
      global: l.isSchoolWide, 
      classIds: l.classIds,
      name: l.name 
    }))
  };

  const prompt = `
    TASK: SOLVE THE SCHOOL TIMETABLE PUZZLE.
    
    CONSTRAINTS:
    1. INSTITUTIONAL LOCKS: ${JSON.stringify(inputData.locks.filter(l => l.global))} are MANDATORY for ALL classes. No subjects can be scheduled here.
    2. TEACHER REST: Every teacher MUST have at least their "minBreaks" distributed across the week.
    3. NO CLASHES: A teacher cannot teach two classes in the same period.
    4. SUBJECT FREQUENCY: Each class must meet its subject "freq" per week exactly.
    5. CONTINUITY: Avoid more than 3 back-to-back periods for any teacher if possible.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN: A clean JSON array of ALL scheduled slots for ALL classes.
    Format: [{ period, day, subjectId, teacherId, classId }]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json"
    }
  });

  const slots = JSON.parse(response.text || '[]');
  return slots.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Create a 12-week teaching plan for these books: ${JSON.stringify(textbooks)}. Breakdown by week. Ensure units match the grade levels provided.`;
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
  return JSON.parse(response.text || '{"weeks":[]}');
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze this school schedule.
    Check:
    1. Teacher burnout (back-to-back periods).
    2. Subject balance (are hard subjects in the morning?).
    3. Room/Staff usage efficiency.
    
    Return JSON: { score, efficiency, insights: [string], burnoutRisks: [string] }
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || '{}');
};
