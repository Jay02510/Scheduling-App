
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      const isRateLimit = errorMsg.includes("429") || error.status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = (i + 1) * 8000 + Math.random() * 1000;
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Programmatic Validation: Finds the "Why" and "Where" of errors
 */
export const validateScheduleProgrammatically = (
  slots: ScheduleSlot[],
  teachers: Teacher[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  lockedSlots: LockedSlot[]
) => {
  const issues: string[] = [];
  const teacherTimeMap: Record<string, Set<string>> = {}; // "teacherId:day:period" -> true
  const classSubjectDailyMap: Record<string, number> = {}; // "classId:day:subjectId" -> count

  slots.forEach(slot => {
    // 1. Teacher Overlap Check
    const tKey = `${slot.teacherId}:${slot.day}:${slot.period}`;
    if (teacherTimeMap[tKey]) {
      const teacherName = teachers.find(t => t.id === slot.teacherId)?.name || "Unknown";
      issues.push(`CRITICAL: Teacher ${teacherName} is scheduled in two places simultaneously (P${slot.period + 1}, Day ${slot.day})`);
    } else {
      teacherTimeMap[tKey] = new Set([slot.classId]);
    }

    // 2. Pedagogical Clash (Same subject twice in one day)
    // Only check if subject freq per week is <= 5 (meaning 1 per day max)
    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.classId}:${slot.day}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        const className = classes.find(c => c.id === slot.classId)?.name || "Unknown";
        issues.push(`PEDAGOGICAL: ${className} has ${subConfig.name} twice on Day ${slot.day}. Max 1 per day expected.`);
      }
    }

    // 3. Lock Violation Check
    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK VIOLATION: Slot at P${slot.period + 1} on Day ${slot.day} is reserved for "${lock.name}" but has been assigned a lesson.`);
    }
  });

  return issues;
};

/**
 * High Speed Batch Generator: Processes multiple classes at once to reduce sync time.
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false,
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  if (onProgress) onProgress("Initializing Quantum Weaver Engine...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  // Strategy: Group classes into batches of 3 to speed up but stay under token/rate limits
  const batches = [];
  for (let i = 0; i < classes.length; i += 3) {
    batches.push(classes.slice(i, i + 3));
  }

  const allDraftSlots: ScheduleSlot[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNames = batch.map(c => c.name).join(", ");
    if (onProgress) onProgress(`Drafting Curriculum for: ${batchNames}...`);

    const batchPrompt = `
      TASK: Generate a high-performance weekly schedule for these classes: ${batchNames}.
      
      CONSTRAINTS:
      - School Hours: ${profile.hours.totalPeriods} periods per day.
      - Lunch is AFTER period ${profile.hours.lunchAfterPeriod}.
      - Respect Global Locks: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide).map(l => ({p: l.period, d: l.dayOfWeek, n: l.name})))}.
      - IMPORTANT: Distribute subjects evenly. NEVER schedule the same subject twice on the same day for a class.
      
      DATA:
      ${JSON.stringify(batch.map(c => ({
        id: c.id,
        name: c.name,
        subjects: c.assignments.map(a => ({
          id: a.subjectId,
          name: profile.subjects.find(s => s.id === a.subjectId)?.name,
          freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek,
          teacherId: a.teacherId
        }))
      })))}

      OUTPUT: JSON format { "slots": Array<{day, period, classId, subjectId, teacherId}> }
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: modelName,
      contents: batchPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    allDraftSlots.push(...(result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) })));
    
    // Minimal jitter to avoid aggressive rate limiting
    if (i < batches.length - 1) await delay(1200);
  }

  // --- WEAVING & REFINEMENT PHASE ---
  if (onProgress) onProgress("Detecting Structural Conflicts...");
  
  // Programmatic pre-check to identify exactly what is wrong
  const initialIssues = validateScheduleProgrammatically(allDraftSlots, teachers, classes, profile, lockedSlots);
  
  if (initialIssues.length === 0) {
    if (onProgress) onProgress("Sync Perfect. No conflicts found.");
    return { slots: allDraftSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Refining ${initialIssues.length} logical overlaps...`);

  // Call the Weaver with specific instructions on what to fix
  const weaverPrompt = `
    TASK: Institutional Conflict Resolver.
    We have an initial schedule draft, but it has specific errors that MUST be fixed.
    
    ERRORS TO FIX:
    ${initialIssues.join("\n")}
    
    GOAL:
    1. Swap lessons to ensure no Teacher is in two places at once.
    2. Ensure no Class has the same subject twice on the same day.
    3. Respect all Locked Slots.
    
    DATA:
    Current Schedule: ${JSON.stringify(allDraftSlots)}
    Teachers: ${JSON.stringify(teachers.map(t => ({id: t.id, name: t.name})))}
    
    RETURN: The ENTIRE corrected schedule in JSON { "slots": Array }.
  `;

  const weaverResponse = await callWithRetry(() => ai.models.generateContent({
    model: useHighPower ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
    contents: weaverPrompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: useHighPower ? 2000 : 0 }
    }
  }));

  const finalResult = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
  const finalSlots = finalResult.slots || allDraftSlots;
  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);

  if (onProgress) onProgress(finalIssues.length === 0 ? "Schedule Integrity Verified." : "Schedule synced with minor warnings.");

  return {
    slots: finalSlots,
    validation: {
      success: finalIssues.length === 0,
      issues: finalIssues
    }
  };
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const prompt = `Perform institutional audit of schedule: ${JSON.stringify(schedule.weeklySlots.slice(0, 50))}`;
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
