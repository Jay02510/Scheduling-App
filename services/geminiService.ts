
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
      issues.push(`OVERLAP: Teacher ${teacher?.name || 'Unknown'} is scheduled for ${className} and ${otherClass} at the same time (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    } else {
      teacherTimeMap[tKey] = slot.classId;
    }

    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`DUPLICATE: ${className} has ${subName} more than once on Day ${slot.day + 1}.`);
      }
    }

    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`CONFLICT: ${className} has a lesson during the blocked time "${lock.name}" (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    }
  });

  return issues;
};

const SYSTEM_DIRECTIVE = `
You are EduPlanner’s Institutional Intelligence Engine. 
Your role is to preserve, optimize, and evolve the school’s OPERATIONAL LOGIC.

PRIMARY OBJECTIVES:
1. Conflict-free schedules (teachers, rooms).
2. Human-sustainability (balanced workload, rest preservation).
3. Minimal change: If constraints are added, modify ONLY the minimum required portion.
4. Preserve institutional memory: Assume prior patterns are intentional decisions.

HARD CONSTRAINTS (NON-NEGOTIABLE):
- No teacher double-booking.
- Guaranteed Rest Slots must NEVER be violated.
- Global Engagements are immutable.

SOFT PRIORITIES (RANKED):
1. Teacher fatigue reduction (Avoid long consecutive blocks).
2. Cognitive load (Prefer subject variety).
3. Stability (Preserve existing slots).
4. Aesthetic clarity (Legible patterns).
`;

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  previousSlots: ScheduleSlot[] = [],
  dirtyClassIds: string[] = [], 
  onProgress?: (msg: string) => void
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  const isIncremental = dirtyClassIds.length > 0 && previousSlots.length > 0;
  const classesToProcess = isIncremental ? classes.filter(c => dirtyClassIds.includes(c.id)) : classes;
  const preservedSlots = isIncremental ? previousSlots.filter(s => !dirtyClassIds.includes(s.classId)) : [];

  if (onProgress) onProgress(isIncremental ? `Preserving trusted state for ${classes.length - dirtyClassIds.length} classes...` : "Initializing Institutional Intelligence Engine...");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (classesToProcess.length === 0) {
    return { slots: previousSlots, validation: { success: true, issues: [] } };
  }

  // Phase 1: Drafting
  const batches = [];
  for (let i = 0; i < classesToProcess.length; i += 4) {
    batches.push(classesToProcess.slice(i, i + 4));
  }

  const draftPromises = batches.map(async (batch) => {
    const draftPrompt = `
      ${SYSTEM_DIRECTIVE}
      
      TASK: Create/Update weekly schedule for: ${batch.map(c => c.name).join(", ")}.
      
      SPECIAL RULES:
      ${profile.specialInstructions || "Keep it simple and balanced."}
      
      EXISTING STATE (TRUSTED):
      ${JSON.stringify(preservedSlots.slice(0, 50))} (Avoid conflicts with these teachers)
      
      DATA:
      ${JSON.stringify(batch.map(c => ({
        id: c.id,
        name: c.name,
        subjects: c.assignments.map(a => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          timesPerWeek: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek
        }))
      })))}

      OUTPUT JSON ONLY: { "slots": Array<{day, period, classId, subjectId, teacherId}> }
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: draftPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
    return (result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
  });

  const draftResults = await Promise.all(draftPromises);
  const combinedSlots: ScheduleSlot[] = [...preservedSlots, ...draftResults.flat()];

  // Phase 2: Guardian Audit
  if (onProgress) onProgress("Performing internal Guardian audit...");
  const issues = validateScheduleProgrammatically(combinedSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Logic integrity verified.");
    return { slots: combinedSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Evaluating trade-offs to fix ${issues.length} conflicts...`);

  const weaverPrompt = `
    ${SYSTEM_DIRECTIVE}
    
    TASK: Resolve schedule conflicts while minimizing surface area change.
    
    PROBLEMS DETECTED:
    ${issues.join("\n")}
    
    CURRENT UNTRUSTED PLAN:
    ${JSON.stringify(combinedSlots)}
    
    INSTRUCTION: Apply the smallest possible correction. Prefer stability over perfect aesthetics.
    OUTPUT JSON ONLY: { "slots": Array }.
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

  if (onProgress) onProgress("Operational health optimized.");

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
    contents: `
      Review the current institutional schedule and produce:
      - An Operational Health Score (0–100)
      - A Burnout Risk Indicator per teacher (Low / Medium / High)
      - Curriculum Coverage Confidence (Safe / Watch / Risk)
      - 3 actionable insights for the administrator.

      DATA: ${JSON.stringify(schedule.weeklySlots.slice(0, 150))}
      FACULTY: ${JSON.stringify(teachers.map(t => ({id: t.id, name: t.name, role: t.role})))}

      OUTPUT JSON ONLY with keys: score, insights (array), burnoutRisks (object {teacherName: risk}), coverageConfidence (string), summary.
    `,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
