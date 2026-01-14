
import { GoogleGenAI, Type } from "@google/genai";
// Added SchoolSchedule to the imports from "../types"
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, ScheduleSlot, SchoolSchedule } from "../types";

const sanitizeJson = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const computeInputHash = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

/**
 * Worker: Generates an ideal schedule for a SINGLE class group.
 * This is designed to be run in parallel.
 */
async function generateClassStream(
  classGroup: ClassGroup,
  profile: SchoolProfile,
  lockedSlots: LockedSlot[],
  allTeachers: Teacher[]
): Promise<ScheduleSlot[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const classAssignments = (classGroup.assignments || []).filter(a => a.teacherId && a.subjectId);
  if (classAssignments.length === 0) return [];

  const inputData = {
    classId: classGroup.id,
    className: classGroup.name,
    periods: profile.hours.totalPeriods,
    lunchAfter: profile.hours.lunchAfterPeriod,
    subjects: classAssignments.map(a => ({
      id: a.subjectId,
      name: profile.subjects.find(s => s.id === a.subjectId)?.name || 'Unknown',
      freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5,
      teacherId: a.teacherId
    })),
    locks: lockedSlots
      .filter(l => l.isSchoolWide || (l.classIds || []).includes(classGroup.id))
      .map(l => ({ day: l.dayOfWeek, period: l.period, name: l.name }))
  };

  const prompt = `
    TASK: Generate an optimal weekly curriculum stream for class: ${classGroup.name}.
    RULES: 
    1. Distribute subjects evenly across 5 days (MON=0 to FRI=4).
    2. Fill all available slots (0 to ${profile.hours.totalPeriods - 1}), prioritizing slots after lunch (${profile.hours.lunchAfterPeriod}).
    3. Respect existing Locks: ${JSON.stringify(inputData.locks)}.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN JSON: { "slots": Array<{period, day, subjectId, teacherId}> }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } // Faster latency
      },
    });
    
    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    return (result.slots || []).map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      classId: classGroup.id
    }));
  } catch (error) {
    console.error(`Worker for ${classGroup.name} failed:`, error);
    return [];
  }
}

/**
 * Orchestrator: Combines parallel streams and resolves teacher conflicts.
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false,
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  if (onProgress) onProgress("Initializing Parallel Worker Pool...");

  // Phase 1: Parallel Generation
  const streamPromises = classes.map(c => {
    if (onProgress) onProgress(`Spinning up worker for ${c.name}...`);
    return generateClassStream(c, profile, lockedSlots, teachers);
  });

  const allStreamResults = await Promise.all(streamPromises);
  const rawSlots = allStreamResults.flat();

  if (onProgress) onProgress("Parallel streams collected. Starting Master Weaving...");

  // Phase 2: Master Conflict Resolution (The "Weaver" Prompt)
  // This uses a higher power model if requested to fix overlaps.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const conflictPrompt = `
    TASK: Institutional Conflict Resolver (Master Weaver).
    The following schedule slots were generated in parallel and likely contain Teacher Clashes (one teacher in two places at once).
    
    YOUR JOB:
    1. Scan for slots where the SAME teacherId is assigned to DIFFERENT classIds at the SAME period/day.
    2. Move those slots to empty periods or swap them with other lessons in the SAME class to resolve the clash.
    3. Ensure every class still meets its subject frequency requirements.
    
    DATA:
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name })))}
    Existing Slots: ${JSON.stringify(rawSlots)}
    Global Constraints: ${profile.specialInstructions || "None"}
    
    RETURN JSON: {
      "slots": Array<{id, period, day, subjectId, teacherId, classId}>,
      "validation": { "success": boolean, "issues": string[] }
    }
  `;

  const weaverModel = useHighPower ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model: weaverModel,
    contents: conflictPrompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: useHighPower ? 4000 : 0 }
    }
  });

  const result = JSON.parse(sanitizeJson(response.text || '{"slots":[], "validation":{"success":false, "issues":["Weaver error"]}}'));
  
  if (onProgress) onProgress("Master Grid Finalized.");
  
  return {
    slots: result.slots,
    validation: result.validation
  };
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const prompt = `
    TASK: Professional Schedule Audit.
    Analyze the following schedule for rule adherence and educational balance.
    Schedule: ${JSON.stringify(schedule.weeklySlots.slice(0, 50))}... (Summary data)
    
    RETURN JSON: {
      "score": number,
      "summary": string,
      "insights": string[],
      "burnoutRisks": string[]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(sanitizeJson(response.text || '{}'));
};
