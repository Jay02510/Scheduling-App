
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, QuarterlyPlan, ScheduleSlot, Textbook, SchoolSchedule, SubjectConfig } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile
): Promise<ScheduleSlot[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sanitizedClasses = classes.map(c => ({
    ...c,
    assignments: (c.assignments || []).filter(a => a.teacherId && a.subjectId)
  })).filter(c => c.assignments.length > 0);

  const inputData = {
    periods: profile.hours.totalPeriods,
    teachers: teachers.map(t => ({ 
      id: t.id, 
      name: t.name, 
      maxDaily: t.maxDailyPeriods,
      minBreaks: t.breaksNeededPerWeek || 5 
    })),
    classes: sanitizedClasses.map(c => ({
      id: c.id,
      name: c.name,
      tasks: c.assignments.map(a => ({
        subjectId: a.subjectId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5,
        teacherId: a.teacherId
      }))
    })),
    locks: lockedSlots.map(l => ({ 
      day: l.dayOfWeek, 
      period: l.period, 
      global: l.isSchoolWide, 
      classIds: l.classIds || [],
      name: l.name 
    }))
  };

  const prompt = `
    TASK: You are a Pro Optimization Engine for school timetables.
    
    CONSTRAINTS:
    1. INSTITUTIONAL LOCKS: 
       - Global locks (global: true) are forbidden for ALL classes. 
       - Class-specific locks (classIds) are forbidden for those specific classes.
       - NEVER assign a subject to a locked (day, period).
    2. NO TEACHER CLASHES: A teacher ID can only appear ONCE per (day, period) across the entire institution.
    3. TEACHER REST: Every teacher MUST have their "minBreaks" distributed.
    4. SUBJECT FREQUENCY: Each class must meet its subject "freq" per week exactly.
    5. CONTINUITY: Max 3 back-to-back periods for any teacher.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN: A JSON array of scheduled slots. 
    FORMAT: [{period, day, subjectId, teacherId, classId}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              period: { type: Type.INTEGER },
              day: { type: Type.INTEGER },
              subjectId: { type: Type.STRING },
              teacherId: { type: Type.STRING },
              classId: { type: Type.STRING }
            },
            required: ["period", "day", "subjectId", "teacherId", "classId"]
          }
        }
      }
    });

    const text = sanitizeJson(response.text || '[]');
    const slots: ScheduleSlot[] = JSON.parse(text);

    // --- VALIDATION LAYER ---
    const teacherSchedule = new Map<string, Set<string>>(); // "day-period" -> Set of teacherIds

    for (const slot of slots) {
      // Check for Teacher Clashes
      const key = `${slot.day}-${slot.period}`;
      if (!teacherSchedule.has(key)) teacherSchedule.set(key, new Set());
      const teachersAtTime = teacherSchedule.get(key)!;
      
      if (teachersAtTime.has(slot.teacherId)) {
        throw new Error(`CRITICAL: Teacher Clash detected at Period ${slot.period + 1}, Day ${slot.day + 1}. A teacher is double-booked.`);
      }
      teachersAtTime.add(slot.teacherId);

      // Check for Lock Violations
      const lockAtSlot = lockedSlots.find(l => 
        l.dayOfWeek === slot.day && 
        l.period === slot.period && 
        (l.isSchoolWide || (l.classIds && l.classIds.includes(slot.classId)))
      );

      if (lockAtSlot) {
        throw new Error(`CRITICAL: Lock violation at Period ${slot.period + 1}, Day ${slot.day + 1} for ${slot.classId}. AI attempted to override an Institutional Lock (${lockAtSlot.name}).`);
      }
    }

    return slots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e: any) {
    console.error("Optimization Engine failed", e);
    throw new Error(e.message || "Timetable optimization failed. Constraints could not be satisfied.");
  }
};

export const generateCurriculumRoadmap = async (
  textbooks: Textbook[],
  profile: SchoolProfile
): Promise<QuarterlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a Pro Optimization Engine. Create a 12-week teaching plan for these books: ${JSON.stringify(textbooks)}. Breakdown by week.`;
  try {
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
                  pages: { type: Type.STRING }
                },
                required: ["weekNumber", "subject", "unit", "pages"]
              }
            }
          },
          required: ["weeks"]
        }
      }
    });
    return JSON.parse(sanitizeJson(response.text || '{"weeks":[]}'));
  } catch (e) {
    console.error("Roadmap optimization failed", e);
    return { quarterName: "Error", weeks: [] };
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a Pro Optimization Engine. Analyze this school schedule for burnout and efficiency. Return JSON { score, insights: [string], burnoutRisks: [string] }.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(sanitizeJson(response.text || '{}'));
  } catch (e) {
    return { score: 0, insights: ["Analysis failed"] };
  }
};
