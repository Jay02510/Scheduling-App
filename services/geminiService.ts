
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
        const waitTime = Math.pow(2, i) * 5000 + Math.random() * 1000;
        await delay(waitTime);
        continue;
      }
      // For other errors, shorter retry
      if (i < maxRetries - 1) {
        await delay(1000);
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
      issues.push(`CRITICAL: Teacher ${teacher?.name || 'Unknown'} is at ${className} and ${otherClass} at the same time (D${slot.day + 1}, P${slot.period + 1}).`);
    } else {
      teacherTimeMap[tKey] = slot.classId;
    }

    // 2. Daily Subject Cap (No same subject twice on one day)
    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`PEDAGOGICAL: ${className} has ${subName} scheduled multiple times on Day ${slot.day + 1}.`);
      }
    }

    // 3. Locked Slot Violations
    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK VIOLATION: ${className} has a lesson during the locked period "${lock.name}" (D${slot.day + 1}, P${slot.period + 1}).`);
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
  
  if (onProgress) onProgress("Firing Parallel Optimization Engines...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  // Increase batch size to 5 for fewer requests
  const batches = [];
  for (let i = 0; i < classes.length; i += 5) {
    batches.push(classes.slice(i, i + 5));
  }

  // Create all promises at once for parallel execution
  const batchPromises = batches.map(async (batch, index) => {
    const batchNames = batch.map(c => c.name).join(", ");
    
    const batchPrompt = `
      TASK: Generate a high-performance weekly schedule for: ${batchNames}.
      
      CORE CONSTRAINTS (ZERO TOLERANCE):
      1. NO teacher can be in two places at once.
      2. NO class can have the same subject more than once in a single day (Day 0-4).
      3. RESPECT LOCKS: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide).map(l => ({p: l.period, d: l.dayOfWeek, n: l.name})))}.
      
      STAFFING DATA:
      ${JSON.stringify(batch.map(c => ({
        id: c.id,
        name: c.name,
        subjects: c.assignments.map(a => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          name: profile.subjects.find(s => s.id === a.subjectId)?.name,
          freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek
        }))
      })))}

      OUTPUT: JSON { "slots": Array<{day, period, classId, subjectId, teacherId}> }
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: modelName,
      contents: batchPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    return (result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  });

  // Wait for all batches in parallel
  const allDraftResults = await Promise.all(batchPromises);
  const allDraftSlots: ScheduleSlot[] = allDraftResults.flat();

  // --- REFINEMENT PASS ---
  if (onProgress) onProgress("Running Institutional Integrity Audit...");
  const issues = validateScheduleProgrammatically(allDraftSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Master Sync Perfect.");
    return { slots: allDraftSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} Identified Conflicts...`);

  // The Weaver handles all conflicts at once with a more powerful model
  const weaverPrompt = `
    TASK: Institutional Weaver. Resolve all conflicts below.
    
    IDENTIFIED CONFLICTS:
    ${issues.slice(0, 50).join("\n")}
    
    CURRENT DRAFT:
    ${JSON.stringify(allDraftSlots)}
    
    INSTRUCTION: Move lessons to empty slots or swap them to ensure NO overlaps. Return the COMPLETE corrected schedule.
    OUTPUT: JSON { "slots": Array }.
  `;

  const weaverResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: weaverPrompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 1500 }
    }
  }));

  const finalResult = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
  const finalSlots = finalResult.slots || allDraftSlots;
  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);

  if (onProgress) onProgress("Synchronization Verified.");

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
    contents: `Analyze schedule for efficiency: ${JSON.stringify(schedule.weeklySlots.slice(0, 50))}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
