
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

export const validateScheduleProgrammatically = (
  slots: ScheduleSlot[],
  teachers: Teacher[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  lockedSlots: LockedSlot[]
) => {
  const issues: string[] = [];
  const teacherTimeMap: Record<string, string> = {}; 
  const classSubjectDailyMap: Record<string, number> = {}; 

  slots.forEach(slot => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const className = classes.find(c => c.id === slot.classId)?.name || "Unknown Class";
    const subName = profile.subjects.find(s => s.id === slot.subjectId)?.name || "Unknown Subject";

    const tKey = `${slot.day}:${slot.period}:${slot.teacherId}`;
    if (teacherTimeMap[tKey] && teacherTimeMap[tKey] !== slot.classId) {
      const otherClass = classes.find(c => c.id === teacherTimeMap[tKey])?.name || "another class";
      issues.push(`CRITICAL OVERLAP: Teacher ${teacher?.name || 'Unknown'} is scheduled for ${className} and ${otherClass} simultaneously (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    } else {
      teacherTimeMap[tKey] = slot.classId;
    }

    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`PEDAGOGICAL CLASH: ${className} has ${subName} more than once on Day ${slot.day + 1}.`);
      }
    }

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
 * Master Sync Engine with Incremental Update Support
 */
export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  previousSlots: ScheduleSlot[] = [],
  dirtyClassIds: string[] = [], // If empty, full re-sync
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  const isIncremental = dirtyClassIds.length > 0 && previousSlots.length > 0;
  const classesToProcess = isIncremental ? classes.filter(c => dirtyClassIds.includes(c.id)) : classes;
  const preservedSlots = isIncremental ? previousSlots.filter(s => !dirtyClassIds.includes(s.classId)) : [];

  if (onProgress) onProgress(isIncremental ? `Running Incremental Sync for ${dirtyClassIds.length} Classes...` : "Initializing Full Infrastructure Sync...");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  if (classesToProcess.length === 0) {
    return { slots: previousSlots, validation: { success: true, issues: [] } };
  }

  // Phase 1: Selective Drafting
  const batches = [];
  for (let i = 0; i < classesToProcess.length; i += 4) {
    batches.push(classesToProcess.slice(i, i + 4));
  }

  const draftPromises = batches.map(async (batch) => {
    const draftPrompt = `
      TASK: Generate a weekly schedule for: ${batch.map(c => c.name).join(", ")}.
      
      HUMAN TUNING & CONTEXT:
      ${profile.specialInstructions || "Standard balanced logic."}
      
      GLOBAL CONSTRAINTS (MUST RESPECT PRESERVED GRID):
      - Periods: 0 to ${profile.hours.totalPeriods - 1}.
      - No Teacher Overlaps.
      - Global Locks: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide).map(l => ({p: l.period, d: l.dayOfWeek, n: l.name})))}.
      
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

  const draftResults = await Promise.all(draftPromises);
  const combinedSlots: ScheduleSlot[] = [...preservedSlots, ...draftResults.flat()];

  // Phase 2: Targeted Resolution
  if (onProgress) onProgress("Auditing Integrity...");
  const issues = validateScheduleProgrammatically(combinedSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Sync Successful.");
    return { slots: combinedSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} Conflicts...`);

  const weaverPrompt = `
    TASK: Institutional Weaver. Resolve schedule conflicts.
    
    MANDATORY TUNING:
    ${profile.specialInstructions || "Balanced logic."}
    
    ERRORS:
    ${issues.join("\n")}
    
    CURRENT DRAFT:
    ${JSON.stringify(combinedSlots)}
    
    INSTRUCTION: Adjust only the necessary slots to fix double-bookings.
    OUTPUT: Full corrected JSON { "slots": Array }.
  `;

  const weaverResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: weaverPrompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2000 }
    }
  }));

  const finalResult = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
  const finalSlots = finalResult.slots || combinedSlots;
  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);

  if (onProgress) onProgress("Sync Complete.");

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
