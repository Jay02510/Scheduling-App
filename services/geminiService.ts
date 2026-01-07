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

/**
 * Suggests teacher-to-subject assignments for classes based on faculty roles.
 */
export const suggestAssignments = async (
  teachers: Teacher[],
  classes: ClassGroup[],
  subjects: SubjectConfig[]
): Promise<{ classId: string; assignments: { subjectId: string; teacherId: string }[] }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Suggest teacher-to-subject assignments for these classes based on teacher roles and subject requirements.
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name, role: t.role })))}
    Classes: ${JSON.stringify(classes.map(c => ({ id: c.id, name: c.name })))}
    Subjects: ${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name, freq: s.frequencyPerWeek })))}
    
    Return JSON array of { classId, assignments: [{ subjectId, teacherId }] }.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
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
    teachers: teachers.map(t => ({ id: t.id, name: t.name, maxDaily: t.maxDailyPeriods })),
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 0,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ day: l.dayOfWeek, period: l.period, global: l.isSchoolWide, classIds: l.classIds }))
  };

  const prompt = `
    TASK: Generate a 5-day school timetable.
    CRITICAL RULES:
    1. LUNCH: Period ${inputData.lunchAfter + 1} is empty (Lunch).
    2. NO DOUBLE BOOKING: A teacher cannot be in two places at once.
    3. NO CLASS OVERLAP: A class can only have one subject per period.
    4. LOCKS: Respect the "locks" provided in data.
    
    Data: ${JSON.stringify(inputData)}
    Return JSON array of { period, day, subjectId, teacherId, classId }.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 12000 },
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
  const prompt = `Create a 12-week teaching plan for these books: ${JSON.stringify(textbooks)}. Breakdown by week.`;
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
  const prompt = `Review this school schedule for teacher workload balance and logic. Provide a score (0-100) and 3 bullet points of feedback.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || '{}');
};