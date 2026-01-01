import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile } from "../types";

export const generateSchedule = async (
  teachers: Teacher[],
  textbooks: Textbook[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile | null
): Promise<SchoolSchedule> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Map textbooks for AI to reference by subject
  const textbookMap = textbooks.reduce((acc, tb) => {
    acc[tb.id] = { title: tb.title, pages: tb.totalPages, chapters: tb.totalChapters };
    return acc;
  }, {} as any);

  const classData = classes.map(c => ({
    id: c.id,
    name: c.name,
    assignments: c.assignments.map(a => {
      const s = profile?.subjects.find(sub => sub.id === a.subjectId);
      const tb = textbooks.find(t => t.id === s?.textbookId);
      return { 
        subject: s?.name, 
        freq: s?.frequencyPerWeek || 0, 
        teacherId: a.teacherId,
        textbook: tb ? { title: tb.title, pages: tb.totalPages } : null
      };
    }).filter(a => a.freq > 0)
  }));

  const lockedSlots = fixedClasses.map(f => ({
    day: f.dayOfWeek,
    period: f.period,
    name: f.name,
    isGlobal: f.isSchoolWide,
    targetClasses: f.classIds
  }));

  const prompt = `
    TASK: Generate a Weekly Master Schedule and 12-Week Quarterly Roadmap.
    
    CONSTRAINTS (CRITICAL):
    1. FIXED SLOTS: The following slots are already occupied. DO NOT place any subject lessons here:
       ${JSON.stringify(lockedSlots)}
    2. STRICT SUBJECTS: ONLY use the subjects provided in the assignments. DO NOT add "filler" or "extra" subjects. If a class has fewer lessons than available periods, leave the remaining periods empty (null).
    3. TEXTBOOK PACING: Use the provided textbook page counts to distribute 12 weeks of targets.
    4. HOLIDAYS: Adjust pacing for: ${JSON.stringify(profile?.specialEvents || [])}.
    5. DATA: ${JSON.stringify(classData)}

    JSON SCHEMA:
    {
      "quarterlyPlan": {
        "weeks": [{ "weekNumber": 1, "subject": "Math", "unit": "Unit 1", "pages": "1-10", "isHolidayWeek": false }]
      },
      "weeklySlots": [{ "period": 0, "day": 0, "subject": "Math", "teacherId": "t1", "classId": "c1", "topic": "Brief Intro" }]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 2000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quarterlyPlan: {
            type: Type.OBJECT,
            properties: {
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
                  }
                }
              }
            }
          },
          weeklySlots: {
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
              }
            }
          }
        },
        required: ["quarterlyPlan", "weeklySlots"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("AI Synthesis Error. Please simplify constraints.");
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