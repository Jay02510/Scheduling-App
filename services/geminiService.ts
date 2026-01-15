
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
    if (teacherTimeMap[tKey]) {
      const otherClass = classes.find(c => c.id === teacherTimeMap[tKey])?.name || "another class";
      issues.push(`OVERLAP: ${teacher?.name || 'Teacher'} is scheduled for both ${className} and ${otherClass} on Day ${slot.day + 1}, Period ${slot.period + 1}.`);
    } else {
      teacherTimeMap[tKey] = slot.classId;
    }

    // 2. Daily Subject Cap (Pedagogical Balance)
    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`PEDAGOGICAL: ${className} has ${subName} twice on Day ${slot.day + 1}. AI should distribute this better.`);
      }
    }

    // 3. Locked Slot Violations
    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK VIOLATION: ${className} is busy with "${lock.name}" at Period ${slot.period + 1}, Day ${slot.day + 1}.`);
    }
  });

  return issues;
};

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  useHighPower: boolean = false,
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  if (onProgress) onProgress("Initializing Batch Sync Engine...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  // Grouping classes for batch processing
  const batches = [];
  for (let i = 0; i < classes.length; i += 3) {
    batches.push(classes.slice(i, i + 3));
  }

  const allDraftSlots: ScheduleSlot[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNames = batch.map(c => c.name).join(", ");
    if (onProgress) onProgress(`Drafting Curriculum for ${batchNames}...`);

    const batchPrompt = `
      TASK: Generate a high-performance weekly schedule for classes: ${batchNames}.
      
      RULES:
      - Day 0=Mon, 1=Tue... 4=Fri. Periods 0 to ${profile.hours.totalPeriods - 1}.
      - Respect Global Locks: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide).map(l => ({p: l.period, d: l.dayOfWeek, n: l.name})))}.
      - One lesson per class per period. No subject duplicates in one day for a single class.
      
      STAFFING & FREQUENCY:
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
      contents: batchPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    allDraftSlots.push(...(result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) })));
    
    if (i < batches.length - 1) await delay(1000);
  }

  // --- REFINEMENT PASS (THE WEAVER) ---
  if (onProgress) onProgress("Auditing Schedule for Conflicts...");
  const issues = validateScheduleProgrammatically(allDraftSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Sync Successful. Zero conflicts.");
    return { slots: allDraftSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} structural overlaps...`);

  const weaverPrompt = `
    TASK: Conflict Resolution Weaver.
    Fix these specific overlaps in the schedule draft. Do NOT change lessons that are already correct.
    
    CONFLICTS TO RESOLVE:
    ${issues.join("\n")}
    
    DRAFT DATA:
    ${JSON.stringify(allDraftSlots)}
    
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
  const finalSlots = finalResult.slots || allDraftSlots;
  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);

  if (onProgress) onProgress(finalIssues.length === 0 ? "Integrity Verified." : "Sync Complete with minor warnings.");

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
    contents: `Institutional Audit of this schedule data: ${JSON.stringify(schedule.weeklySlots.slice(0, 100))}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
