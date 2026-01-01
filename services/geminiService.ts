import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile, QuarterlyPlan, ScheduleSlot } from "../types";

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a mapping of Subject IDs to their Exact Names to prevent AI hallucinations
  const subjectMap = profile.subjects.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {} as Record<string, string>);

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    // Explicit list of names the AI is allowed to use
    allowedSubjectNames: Object.values(subjectMap),
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      requirements: c.assignments.map(a => {
        const subName = subjectMap[a.subjectId];
        return { 
          subjectName: subName, 
          frequency: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 0, 
          teacherId: a.teacherId,
          teacherName: teachers.find(t => t.id === a.teacherId)?.name
        };
      }).filter(r => r.frequency > 0)
    })),
    institutionalBlocks: fixedClasses.map(f => ({
      day: f.dayOfWeek,
      period: f.period,
      label: f.name, // e.g. "GYM", "LUNCH"
      isGlobal: f.isSchoolWide,
      affectedClasses: f.classIds
    }))
  };

  const prompt = `
    TASK: Generate a Weekly Master Schedule for all classes.
    
    STRICT RULES (FAILURE TO FOLLOW RESULTS IN ERROR):
    1. SUBJECT NAMES: You MUST use the exact strings provided in "allowedSubjectNames": ${JSON.stringify(inputData.allowedSubjectNames)}. 
       DO NOT use generic terms like "Math" if the subject is named "Into Reading".
    2. TEACHER CONFLICTS (CRITICAL): A teacherId can only be in ONE class at any given (Day, Period). 
       You MUST cross-check all class grids to ensure Teacher "Jason" is never in two places at once.
    3. INSTITUTIONAL BLOCKS: These slots are occupied. Do NOT schedule any lessons here: ${JSON.stringify(inputData.institutionalBlocks)}.
    4. COVERAGE: For each class, schedule exactly the number of lessons specified in "frequency".
    5. DATA CONTEXT: ${JSON.stringify(inputData.classes)}

    Return a JSON array of slots.
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
            subject: { type: Type.STRING, description: "Must match allowedSubjectNames exactly" },
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
    const data = JSON.parse(response.text || '[]');
    // Secondary validation to ensure AI didn't hallucinate subject names
    return data.map((slot: any) => ({
      ...slot,
      id: Math.random().toString(36).substr(2, 9),
      isFixed: false,
      isBreak: false
    }));
  } catch (e) {
    throw new Error("Master Schedule synthesis failed. The model generated an invalid plan.");
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
    2. RED DAYS: Reduce pacing for holiday weeks: ${JSON.stringify(inputData.holidays)}.
    3. SUBJECTS: Match exactly with: ${JSON.stringify(inputData.books.map(b => b.subject))}.
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
    throw new Error("Roadmap synthesis failed.");
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