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
    TASK: Generate a WEEKLY MASTER SCHEDULE and a 12-WEEK QUARTERLY CURRICULUM ROADMAP.
    
    INPUT DATA:
    - Textbooks (Pacing Source): ${JSON.stringify(textbooks.map(t => ({ title: t.title, chapters: t.totalChapters, pages: t.totalPages, subject: t.subject })))}
    - School Calendar (Red Days): ${JSON.stringify(profile?.specialEvents || [])}
    - Class Requirements: ${JSON.stringify(classChecklist)}
    
    CONSTRAINTS:
    1. QUARTERLY ROADMAP (12 Weeks): Distribute textbook chapters/pages across 12 weeks. 
    2. HOLIDAY AWARENESS: Identify weeks with Red Days. Reduce the page/unit target for those weeks. Label them with "isHolidayWeek: true" and the holiday name.
    3. MASTER SCHEDULE: Ensure all periods (0-${(profile?.hours.totalPeriods || 8) - 1}) and days (0-4) are filled according to frequency requirements.
    4. SPEED: Be concise in the "topic" fields. Focus on textbook units.

    OUTPUT JSON FORMAT:
    {
      "quarterlyPlan": {
        "quarterName": "Quarter 1",
        "weeks": [
          { "weekNumber": 1, "subject": "Math", "unit": "Unit 1: Logic", "pages": "1-12", "isHolidayWeek": false }
        ]
      },
      "weeklySlots": [
        { "id": "uuid", "period": 0, "day": 0, "subject": "Math", "teacherId": "t1", "classId": "c1", "topic": "Unit 1.1 Intro" }
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
          quarterlyPlan: {
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
        required: ["quarterlyPlan", "weeklySlots"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Parse Error:", e);
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