
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
        // Exponential backoff for rate limits
        const waitTime = Math.pow(2, i) * 6000 + Math.random() * 1000;
        await delay(waitTime);
        continue;
      }
      if (i < maxRetries - 1) {
        await delay(1500);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Programmatic Validation: Pinpoints exactly where and why the schedule fails.
 */
export const validateScheduleProgrammatically = (
  slots: ScheduleSlot[],
  teachers: Teacher[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  lockedSlots: LockedSlot[]
) => {
  const issues: string[] = [];
  const teacherTimeMap: Record<string, string> = {}; // "day:period:teacherId" -> classId
  const classSubjectDailyMap: Record<string, number> = {}; // "day:classId:subjectId" -> count

  slots.forEach(slot => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const className = classes.find(c => c.id === slot.classId)?.name || "Unknown Class";
    const subName = profile.subjects.find(s => s.id === slot.subjectId)?.name || "Unknown Subject";

    // 1. Teacher Double-Booking
    const tKey = `${slot.day}:${slot.period}:${slot.teacherId}`;
    if (teacherTimeMap[tKey] && teacherTimeMap[tKey] !== slot.classId) {
      const otherClass = classes.find(c => c.id === teacherTimeMap[tKey])?.name || "another class";
      issues.push(`CRITICAL OVERLAP: Teacher ${teacher?.name || 'Unknown'} is scheduled for ${className} and ${otherClass} simultaneously (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    } else {
      teacherTimeMap[tKey] = slot.classId;
    }

    // 2. Daily Subject Cap (Pedagogical Balance)
    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`PEDAGOGICAL CLASH: ${className} has ${subName} more than once on Day ${slot.day + 1}.`);
      }
    }

    // 3. Locked Slot Violations
    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK VIOLATION: ${className} has a lesson assigned during the blocked period "${lock.name}" (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    }
  });

  return issues;
};

/**
 * Master Sync Engine:
 * Phase 1: Concurrent Drafting (Parallel)
 * Phase 2: Institutional Weaver (Contextual Refinement)
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false,
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  if (onProgress) onProgress("Initializing Concurrent Sync Engines...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  // Batching: 4 classes per request is a good balance for context density vs token limits
  const batches = [];
  for (let i = 0; i < classes.length; i += 4) {
    batches.push(classes.slice(i, i + 4));
  }

  // Phase 1: Drafting (Parallel requests)
  const draftPromises = batches.map(async (batch, index) => {
    const batchNames = batch.map(c => c.name).join(", ");
    
    const draftPrompt = `
      TASK: Generate a weekly schedule for: ${batchNames}.
      
      HUMAN TUNING & SPECIAL INSTRUCTIONS (MANDATORY):
      ${profile.specialInstructions || "None provided. Use standard balanced logic."}
      
      INSTITUTIONAL RULES:
      1. Periods: 0 to ${profile.hours.totalPeriods - 1}.
      2. No Teacher Overlaps.
      3. No duplicate subjects for a class on the same day.
      4. Global Locks: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide).map(l => ({p: l.period, d: l.dayOfWeek, n: l.name})))}.
      
      DATA:
      ${JSON.stringify(batch.map(c => ({
        id: c.id,
        name: c.name,
        curriculum: c.assignments.map(a => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek
        }))
      })))}

      OUTPUT JSON: { "slots": Array<{day, period, classId, subjectId, teacherId}> }
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: modelName,
      contents: draftPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    return (result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  });

  if (onProgress) onProgress("Syncing Curriculum Streams...");
  const draftResults = await Promise.all(draftPromises);
  const allDraftSlots: ScheduleSlot[] = draftResults.flat();

  // Phase 2: Conflict Resolution (The Weaver)
  if (onProgress) onProgress("Auditing Institutional Logic...");
  const issues = validateScheduleProgrammatically(allDraftSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Sync Successful. Zero conflicts.");
    return { slots: allDraftSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} Structural Overlaps...`);

  // The Weaver pass uses a higher reasoning budget to handle multi-point constraints
  const weaverPrompt = `
    TASK: Institutional Conflict Resolution.
    We have a draft schedule with specific errors. Fix them while respecting the original human tuning.
    
    MANDATORY TUNING INSTRUCTIONS:
    ${profile.specialInstructions || "Follow standard balanced scheduling logic."}
    
    IDENTIFIED ERRORS (MUST FIX):
    ${issues.join("\n")}
    
    CURRENT DRAFT:
    ${JSON.stringify(allDraftSlots)}
    
    RULES:
    - You MUST return a full valid schedule JSON.
    - Swap lesson slots to resolve teacher/class overlaps.
    - DO NOT double-schedule teachers.
    
    OUTPUT: Full corrected JSON { "slots": Array }.
  `;

  const weaverResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: weaverPrompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2500 }
    }
  }));

  const finalResult = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
  const finalSlots = finalResult.slots || allDraftSlots;
  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);

  if (onProgress) onProgress(finalIssues.length === 0 ? "Integrity Verified." : "Sync Complete (Minor warnings).");

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Institutional audit of schedule: ${JSON.stringify(schedule.weeklySlots.slice(0, 100))}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
