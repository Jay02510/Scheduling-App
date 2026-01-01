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

  // Minimalist data set to reduce prompt size and speed up processing
  const classChecklist = classes.map(c => ({
    id: c.id,
    reqs: c.assignments.map(a => {
      const s = profile?.subjects.find(sub => sub.id === a.subjectId);
      return { 
        s: s?.name, 
        f: s?.frequencyPerWeek || 0, 
        tId: a.teacherId 
      };
    }).filter(a => a.f > 0 && a.tId)
  }));

  const prompt = `
    TASK: Generate a Weekly Master Schedule AND a 12-Week Quarterly Roadmap.
    
    INPUT:
    - Textbooks: ${JSON.stringify(textbooks.map(t => ({ title: t.title, chapters: t.totalChapters, pages: t.totalPages, subject: t.subject })))}
    - Holidays/Red Days: ${JSON.stringify(profile?.specialEvents || [])}
    - Requirements: ${JSON.stringify(classChecklist)}
    
    STRICT RULES:
    1. QUARTERLY ROADMAP: Exactly 12 weeks. Distribute textbook pages logically.
    2. RED DAYS: If a week has holidays, reduce the page target significantly. Mark isHolidayWeek: true.
    3. MASTER SCHEDULE: Fill periods 0-${(profile?.hours.totalPeriods || 8) - 1} for days 0-4. Ensure teacher/subject frequencies match requirements.
    4. EFFICIENCY: Keep "topic" strings under 30 characters.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 4000 }, // Enable moderate reasoning for complex scheduling
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
            },
            required: ["quarterName", "weeks"]
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
    const rawText = response.text || "";
    // Clean up potential markdown if the model ignored responseMimeType (safeguard)
    const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Critical AI Response Error:", e);
    throw new Error("The AI failed to generate a valid schedule structure. Please try again with fewer constraints.");
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Audit institutional performance for the following schedule data: ${JSON.stringify({ profile, schedule })}`;
  
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
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { score: 0, insights: ["Unable to analyze at this time."], burnoutRisks: [], efficiency: 0, constraintScore: 0 };
  }
};