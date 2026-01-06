import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, FixedClass, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

export const parseStaffList = async (text: string): Promise<Partial<Teacher>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Parse this raw text into a JSON array of Teacher objects. 
    Infer "role" (homeroom, korean, or subject) based on titles.
    Raw Text: "${text}"
    Return JSON array with keys: name, role.
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
            role: { type: Type.STRING, enum: ['homeroom', 'korean', 'subject'] }
          },
          required: ["name", "role"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const suggestAssignments = async (
  teachers: Teacher[],
  classes: ClassGroup[],
  subjects: SubjectConfig[]
): Promise<{ classId: string; assignments: { subjectId: string; teacherId: string }[] }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze these teachers and classes. Suggest subject assignments.
    Rules: 
    - Floating teachers can be assigned to multiple classes.
    - Homeroom teachers usually get their own class's core subjects.
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name, role: t.role, subjects: t.subjects })))}
    Classes: ${JSON.stringify(classes.map(c => ({ id: c.id, name: c.name, grade: c.grade })))}
    Subjects: ${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name })))}
    Return JSON array mapping classId to an array of assignments (subjectId, teacherId).
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
            classId: { type: Type.STRING },
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subjectId: { type: Type.STRING },
                  teacherId: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const validSubjectIds = profile.subjects.map(s => s.id);
  const validTeacherIds = teachers.map(t => t.id);
  const validClassIds = classes.map(c => c.id);

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    lunchPeriod: profile.hours.lunchAfterPeriod,
    teachers: teachers.map(t => ({
      id: t.id,
      maxDaily: t.maxDailyPeriods,
      minBreaksWeekly: t.breaksNeededPerWeek,
      prefs: t.preferences
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
    STRICT MASTER SCHEDULING TASK:
    Generate a conflict-free weekly schedule for all classes and teachers.

    CONSTRAINTS:
    1. NO TEACHER CLASHES: A teacher (e.g., ID "t-1") can ONLY be assigned to ONE class in any given (Day, Period) slot.
    2. BREAKS: Each teacher MUST have at least ${inputData.teachers[0]?.minBreaksWeekly || 5} free periods (breaks) per week where they are NOT teaching.
    3. LUNCH: Period ${inputData.lunchPeriod} is a global lock. No assignments.
    4. FREQUENCY: Every class MUST meet their subjects the exact number of times defined in their assignments.
    5. FLOATING: Teachers move between classes. Ensure the transitions are logical.

    Input Data: ${JSON.stringify(inputData)}
    
    Output Format: JSON array of ScheduleSlot { period, day, subjectId, teacherId, classId }.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 8000 },
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
    return rawData.filter((slot: any) => 
      validSubjectIds.includes(slot.subjectId) && 
      validTeacherIds.includes(slot.teacherId) && 
      validClassIds.includes(slot.classId)
    ).map((slot: any) => ({
      ...slot,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    throw new Error("Master Schedule synthesis failed. The model could not solve the constraints.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate a 12-week lesson roadmap for: ${JSON.stringify(textbooks)}.`;
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

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Audit the schedule for teacher burnout and clashes.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          constraintScore: { type: Type.NUMBER },
          efficiency: { type: Type.NUMBER },
          burnoutRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};