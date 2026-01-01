import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile } from "../types";

export const generateSchedule = async (
  teachers: Teacher[],
  textbooks: Textbook[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile | null
): Promise<SchoolSchedule> => {
  // Ensure we use a fresh instance to avoid stale keys or session states
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Streamline data to the absolute essentials to keep the prompt small
  const classChecklist = classes.map(c => ({
    id: c.id,
    name: c.name,
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
    GENERATE: 1) Weekly Master Schedule 2) 12-Week Quarterly Roadmap.
    
    DATA:
    - Textbooks: ${JSON.stringify(textbooks.map(t => ({ title: t.title, pages: t.totalPages, subject: t.subject })))}
    - Holidays: ${JSON.stringify(profile?.specialEvents || [])}
    - Requirements: ${JSON.stringify(classChecklist)}
    
    CONSTRAINTS:
    - Master: Fill periods 0-${(profile?.hours.totalPeriods || 8) - 1} (Days 0-4).
    - Roadmap: 12 weeks of targets. Adjust pacing for holiday weeks.
    - Format: Strict JSON output.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // Lowered thinking budget slightly to favor latency while maintaining quality
        thinkingConfig: { thinkingBudget: 2000 }, 
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

    const rawText = response.text || "";
    const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    if (!jsonStr) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Generation Failed:", e);
    throw new Error("Failed to synthesize schedule. Please check your staff/class assignments and try again.");
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Audit institutional performance for: ${JSON.stringify({ profile, schedule })}`;
  
  try {
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
  } catch (e) {
    return { score: 0, insights: ["Audit unavailable"], burnoutRisks: [], efficiency: 0, constraintScore: 0 };
  }
};