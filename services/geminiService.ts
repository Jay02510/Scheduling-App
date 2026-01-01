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

  const classChecklist = classes.map(c => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    requirements: c.assignments.map(a => {
      const s = profile?.subjects.find(sub => sub.id === a.subjectId);
      const t = teachers.find(teach => teach.id === a.teacherId);
      return { 
        subject: s?.name, 
        frequency: s?.frequencyPerWeek || 0, 
        teacher: t?.name,
        teacherId: a.teacherId 
      };
    }).filter(a => a.frequency > 0 && a.teacherId)
  }));

  const prompt = `
    TASK: Generate a COMPLETE weekly master schedule AND a MONTHLY curriculum roadmap.
    
    CURRICULUM DATA:
    Textbooks: ${JSON.stringify(textbooks.map(t => ({ title: t.title, chapters: t.totalChapters, pages: t.totalPages, subject: t.subject })))}
    Red Days (Holidays/Events): ${JSON.stringify(profile?.specialEvents || [])}
    
    MANDATORY CRITERIA:
    1. WEEKLY MASTER: Create slots (period 0-${(profile?.hours.totalPeriods || 8) - 1}, days 0-4) for all classes.
    2. MONTHLY ROADMAP: Break down each month into 4 weeks. For EACH week, calculate the Unit/Chapter and Page range to cover based on textbook totals.
    3. SKIP RED DAYS: When calculating monthly pacing, acknowledge red days provided. If a week has 3 holidays, pacing should be slower.
    4. DATA CHECKLIST: ${JSON.stringify(classChecklist)}

    OUTPUT JSON SCHEMA:
    {
      "yearlyPlan": [
        {
          "month": "September",
          "weeks": [
            { "weekNumber": 1, "subject": "Math", "unit": "Unit 1", "pages": "1-15" }
          ]
        }
      ],
      "weeklySlots": [
        { "id": "uuid", "period": 0, "day": 0, "subject": "Math", "teacherId": "t1", "classId": "c1", "topic": "Introduction to numbers" }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yearlyPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                weeks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      weekNumber: { type: Type.INTEGER },
                      subject: { type: Type.STRING },
                      unit: { type: Type.STRING },
                      pages: { type: Type.STRING }
                    }
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
                id: { type: Type.STRING },
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
        required: ["yearlyPlan", "weeklySlots"]
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (e) {
    throw new Error("AI Synthesis Failed");
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
        },
        required: ["score", "insights", "burnoutRisks", "efficiency", "constraintScore"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};