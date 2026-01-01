import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile, QuarterlyPlan, ScheduleSlot } from "../types";

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a mapping of Subject IDs to their Exact Names
  const subjectMap = profile.subjects.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {} as Record<string, string>);

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    exactAllowedNames: Object.values(subjectMap),
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      requirements: c.assignments.map(a => {
        const subName = subjectMap[a.subjectId];
        return { 
          subjectId: a.subjectId,
          subjectName: subName, 
          frequency: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 0, 
          teacherId: a.teacherId
        };
      }).filter(r => r.frequency > 0)
    })),
    institutionalBlocks: fixedClasses.map(f => ({
      day: f.dayOfWeek,
      period: f.period,
      name: f.name,
      isGlobal: f.isSchoolWide,
      classIds: f.classIds
    }))
  };

  const prompt = `
    TASK: Generate a Weekly Master Schedule for ALL classes simultaneously.
    
    STRICT SUBJECT NAMING RULE:
    - You MUST ONLY use names from this list: ${JSON.stringify(inputData.exactAllowedNames)}.
    - FORBIDDEN: Do NOT use generic names like "English", "Math", "Reading", or "Science" UNLESS they appear in the allowed list above. 
    - Example: If the allowed list has "Into Reading", do NOT output "English" or "Reading". Output "Into Reading".

    TEACHER AVAILABILITY RULE (ZERO CONFLICTS):
    - A teacher (teacherId) can ONLY be in ONE place at any given time (Day X, Period Y).
    - If Teacher "Jason" is in Class "Zest" at Mon P1, he is UNAVAILABLE for all other classes at Mon P1.
    - You MUST cross-check all class assignments to ensure zero overlaps.

    LOCKED SLOTS:
    - Do NOT place lessons in these coordinates: ${JSON.stringify(inputData.institutionalBlocks)}.

    DATA: ${JSON.stringify(inputData.classes)}
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
            subject: { type: Type.STRING },
            teacherId: { type: Type.STRING },
            classId: { type: Type.STRING }
          },
          required: ["period", "day", "subject", "teacherId", "classId"]
        }
      }
    }
  });

  try {
    const rawData = JSON.parse(response.text || '[]');
    
    // Post-Processing Sanitizer: Correct AI Hallucinations
    return rawData.map((slot: any) => {
      // Find the intended subject name by looking at the class assignments
      const cls = classes.find(c => c.id === slot.classId);
      const assignment = cls?.assignments.find(a => a.teacherId === slot.teacherId);
      const correctedName = assignment ? subjectMap[assignment.subjectId] : slot.subject;

      return {
        ...slot,
        id: Math.random().toString(36).substr(2, 9),
        subject: correctedName, // Force use of user-defined name
        isFixed: false,
        isBreak: false
      };
    });
  } catch (e) {
    throw new Error("Failed to synthesize schedule. Please check your data and try again.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Create a 12-week pacing roadmap for these books: ${JSON.stringify(textbooks.map(t => ({ title: t.title, pages: t.totalPages, subject: t.subject })))}`;

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
              }
            }
          }
        }
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