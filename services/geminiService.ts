
import { GoogleGenAI, Type } from "@google/genai";
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
 * Utility to wait for a specific duration
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust API wrapper with exponential backoff for rate limits (429)
 */
async function callWithRetry(fn: () => Promise<any>, maxRetries = 4): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      const isRateLimit = errorMsg.includes("429") || error.status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED");
      
      if (isRateLimit && i < maxRetries - 1) {
        // Longer wait for rate limits - usually requires at least 15-20s
        const waitTime = (i + 1) * 10000 + Math.random() * 2000; 
        console.warn(`Rate limit triggered. Cooling down for ${Math.round(waitTime/1000)}s before retry...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Worker: Generates an ideal schedule for a SINGLE class group.
 * Always uses 'flash' model for maximum quota availability.
 */
async function generateClassStream(
  classGroup: ClassGroup,
  profile: SchoolProfile,
  lockedSlots: LockedSlot[],
  globalLoadSummary: string // Inform the worker about already used teachers
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
    TASK: Generate a weekly curriculum stream for class: ${classGroup.name}.
    CURRENT GLOBAL TEACHER LOAD: ${globalLoadSummary}
    
    RULES: 
    1. Distribute subjects evenly across 5 days (MON=0 to FRI=4).
    2. Fill all available slots (0 to ${profile.hours.totalPeriods - 1}).
    3. Respect existing Locks: ${JSON.stringify(inputData.locks)}.
    4. Try to avoid teachers mentioned as "High Load" in the summary if possible for this time slot.
    
    DATA: ${JSON.stringify(inputData)}
    
    RETURN JSON: { "slots": Array<{period, day, subjectId, teacherId}> }
  `;

  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    
    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    return (result.slots || []).map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      classId: classGroup.id
    }));
  });
}

/**
 * Orchestrator: Combines sequential processing with a "Weaver" pass.
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false,
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  const rawSlots: ScheduleSlot[] = [];
  let globalLoadSummary = "None yet.";

  if (onProgress) onProgress("Warming up the Throttled Engine...");

  // Process classes sequentially to respect RPM limits
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    if (onProgress) onProgress(`Drafting stream for ${cls.name} (${i + 1}/${classes.length})...`);
    
    const classSlots = await generateClassStream(cls, profile, lockedSlots, globalLoadSummary);
    rawSlots.push(...classSlots);

    // Update global load summary for the next worker
    const teacherUsage = classSlots.reduce((acc: any, s) => {
      acc[s.teacherId] = (acc[s.teacherId] || 0) + 1;
      return acc;
    }, {});
    globalLoadSummary = Object.entries(teacherUsage)
      .map(([id, count]) => `${teachers.find(t => t.id === id)?.name || id}: ${count} periods used`)
      .join(", ");

    // Mandatory cooldown to prevent 429
    if (i < classes.length - 1) {
      if (onProgress) onProgress(`Respecting API Quota... (${i + 1}/${classes.length})`);
      await delay(2000); 
    }
  }

  if (onProgress) onProgress("Weaving Global Master Grid...");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const weaverModel = useHighPower ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const conflictPrompt = `
    TASK: Institutional Conflict Resolver.
    Identify and fix Teacher Overlaps in the provided master grid.
    
    DATA:
    Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name })))}
    Existing Slots: ${JSON.stringify(rawSlots)}
    Constraints: ${profile.specialInstructions || "None"}
    
    RETURN JSON: {
      "slots": Array<{id, period, day, subjectId, teacherId, classId}>,
      "validation": { "success": boolean, "issues": string[] }
    }
  `;

  const result = await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: weaverModel,
      contents: conflictPrompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: useHighPower ? 4000 : 0 }
      }
    });
    return JSON.parse(sanitizeJson(response.text || '{"slots":[], "validation":{"success":false, "issues":["Engine error"]}}'));
  });
  
  if (onProgress) onProgress("Schedule Successfully Synchronized.");
  
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
  const prompt = `Perform institutional audit of schedule: ${JSON.stringify(schedule.weeklySlots.slice(0, 30))}`;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(sanitizeJson(response.text || '{}'));
  });
};
