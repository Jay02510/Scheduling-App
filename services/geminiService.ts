
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

  // Explicit mapping of requirements for AI consumption
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
    TASK: Generate a COMPLETE and ACCURATE weekly master schedule for ${profile?.name}.
    
    COUNT CHECK: You are scheduling for exactly ${classes.length} class groups.
    CLASSES TO INCLUDE: [${classes.map(c => c.name).join(', ')}]
    
    MANDATORY CRITERIA:
    1. INDIVIDUAL CLASS COVERAGE: For EVERY class ID provided, you MUST return a set of schedule slots that satisfy its curriculum requirements.
    2. TEACHER CONFLICTS: A teacher cannot teach multiple classes at the same period.
    3. TIME SLOTS: Use period numbers 0 to ${ (profile?.hours.totalPeriods || 8) - 1 } and days 0 to 4 (Mon-Fri).
    4. INSTITUTIONAL BLOCKS: ${JSON.stringify(fixedClasses.map(f => ({ day: f.dayOfWeek, period: f.period, name: f.name })))}
    5. DATA CHECKLIST: ${JSON.stringify(classChecklist)}

    RULES:
    - If a class has 'Math' 5 times/week, assign it to 5 distinct periods for that class.
    - If a class has NO assignments, leave it as is but ensure it exists in the master list.
    - Provide a unique 'topic' or 'lesson goal' for each slot using curriculum sources: ${JSON.stringify(textbooks.map(t => t.title))}.

    OUTPUT:
    Return a JSON object containing "yearlyPlan" (curriculum overview) and "weeklySlots" (full array of period assignments).
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
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      chapters: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    if (!parsed.weeklySlots || parsed.weeklySlots.length === 0) {
      throw new Error("AI returned an empty schedule.");
    }
    return parsed;
  } catch (e) {
    throw new Error("AI Synthesis Failed: " + (e as Error).message);
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
