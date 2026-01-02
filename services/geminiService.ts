import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Textbook, FixedClass, ClassGroup, SchoolSchedule, SchoolProfile, QuarterlyPlan, ScheduleSlot } from "../types";

/**
 * Synthesizes a master schedule grid while respecting all provided institutional constraints.
 * Uses gemini-3-pro-preview for advanced reasoning requirements of combinatorial scheduling.
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  fixedClasses: FixedClass[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Map IDs to exact names for sanitization and identification
  const subjectMap = profile.subjects.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {} as Record<string, string>);

  const inputData = {
    totalPeriods: profile.hours.totalPeriods,
    lunchPeriod: profile.hours.lunchAfterPeriod,
    validSubjectNames: Object.values(subjectMap),
    teachers: teachers.map(t => ({
      id: t.id,
      name: t.name,
      maxDaily: t.maxDailyPeriods,
      minBreaks: t.breaksNeededPerWeek
    })),
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
    locks: fixedClasses.map(f => ({
      day: f.dayOfWeek,
      period: f.period,
      name: f.name,
      isGlobal: f.isSchoolWide,
      classIds: f.classIds
    }))
  };

  const prompt = `
    TASK: Generate a Weekly Master Schedule (Days 0-4, Periods 0-${inputData.totalPeriods - 1}).
    
    STRICT RULES (NON-NEGOTIABLE):
    1. SUBJECT NAMES: Use ONLY these strings: ${JSON.stringify(inputData.validSubjectNames)}. 
       DO NOT use abbreviations or generic academic terms (e.g., if "Into Reading" is provided, do NOT output "English").
    2. TEACHER CONFLICTS: A teacher (teacherId) CANNOT be in two classes at the same (Day, Period). 
    3. MAX LOAD: A teacher cannot exceed their "maxDaily" periods in any single day across all classes.
    4. BREAKS: Ensure teachers have at least some gaps in their schedule based on their "minBreaks" requirement.
    5. LUNCH: Period index ${inputData.lunchPeriod} is reserved for LUNCH for all classes. Do NOT schedule anything there.
    6. FIXED BLOCKS: Do not schedule lessons in these pre-occupied slots: ${JSON.stringify(inputData.locks)}.
    7. DATA: ${JSON.stringify(inputData.classes)}

    Output a flat JSON list of ScheduleSlot objects.
  `;

  // Upgrading to gemini-3-pro-preview for complex reasoning task (scheduling)
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
    
    // Sanitizer: Ensure subject names match the assignments exactly to prevent "English/Math" hallucinations
    return rawData.map((slot: any) => {
      const cls = classes.find(c => c.id === slot.classId);
      const assignment = cls?.assignments.find(a => a.teacherId === slot.teacherId);
      const finalSubjectName = assignment ? subjectMap[assignment.subjectId] : slot.subject;

      return {
        ...slot,
        id: Math.random().toString(36).substr(2, 9),
        subject: finalSubjectName,
        isFixed: false,
        isBreak: false
      };
    });
  } catch (e) {
    throw new Error("Master Schedule synthesis failed. The model generated invalid JSON.");
  }
};

/**
 * Generates a weekly lesson roadmap based on textbook resources and school events.
 */
export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Generate a 12-week lesson plan pacing guide for these textbooks: ${JSON.stringify(textbooks.map(t => ({ title: t.title, pages: t.totalPages, subject: t.subject })))}.
    Consider the school profile and any holidays: ${JSON.stringify(profile.specialEvents)}.
    Distribute the total pages reasonably across the 12 weeks.
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

/**
 * Analyzes a completed schedule for efficiency, constraints, and potential teacher burnout.
 * Resolves the missing export for AnalyticsDashboard.
 */
export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Audit this school schedule for quality, constraints, and efficiency.
    PROFILE: ${JSON.stringify(profile)}
    TEACHERS: ${JSON.stringify(teachers)}
    SCHEDULE: ${JSON.stringify(schedule)}
    
    Evaluate and provide:
    1. A total quality score (0-100).
    2. A constraintScore (0-100) specifically for logic/rule adherence.
    3. An efficiency rating (0.0 to 1.0).
    4. A list of burnoutRisks (strings) for overloaded staff.
    5. A list of actionable insights (strings).
  `;

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
        },
        required: ["score", "constraintScore", "efficiency", "burnoutRisks", "insights"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Schedule audit failed.");
  }
};