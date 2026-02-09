
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, ScheduleSlot, SchoolSchedule } from "../types";

const sanitizeJson = (text: string) => {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
  return cleaned;
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
        const waitTime = Math.pow(2, i) * 10000 + Math.random() * 2000;
        await delay(waitTime);
        continue;
      }
      if (i < maxRetries - 1) {
        await delay(2000);
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
  const teacherTimeMap: Record<string, { classId: string, className: string, subName: string }> = {}; 
  const classSubjectDailyMap: Record<string, number> = {}; 

  slots.forEach(slot => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const classObj = classes.find(c => c.id === slot.classId);
    const className = classObj?.name || "Unknown Class";
    const subName = profile.subjects.find(s => s.id === slot.subjectId)?.name || "Unknown Subject";

    if (!slot.teacherId || slot.teacherId === "undefined") {
      issues.push(`ERROR: Missing teacher for "${subName}" in "${className}" (Day ${slot.day + 1}, P${slot.period + 1}).`);
    } else {
      const tKey = `${slot.day}:${slot.period}:${slot.teacherId}`;
      if (teacherTimeMap[tKey] && teacherTimeMap[tKey].classId !== slot.classId) {
        issues.push(`OVERLAP: ${teacher?.name || 'Teacher'} is double-booked for "${className}" and "${teacherTimeMap[tKey].className}" (Day ${slot.day + 1}, P${slot.period + 1}).`);
      } else {
        teacherTimeMap[tKey] = { classId: slot.classId, className, subName };
      }
    }

    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`DUPLICATE: ${className} has "${subName}" twice on Day ${slot.day + 1}.`);
      }
    }

    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK: ${className} scheduled during "${lock.name}" (Day ${slot.day + 1}, P${slot.period + 1}).`);
    }
  });

  return issues;
};

const SYSTEM_DIRECTIVE = `
You are a World-Class School Scheduler.
Rules:
1. NO-FLY ZONES: Do not schedule anything during "LOCKED" periods (Lunch, Gym, Morning Work).
2. FACULTY PHYSICS: A teacher cannot be in two places at once. If they are busy in one class, they are unavailable for all others.
3. TEMPORAL VARIETY (MANDATORY): Do NOT put subjects at the same time every day. Spread them across mornings and afternoons throughout the week.
4. FILL THE GRID: Ensure every subject meets its frequency and the daily grid is full.
`;

export const generateWeeklyMaster = async (
  teachers: Teacher[],
  lockedSlots: LockedSlot[],
  classes: ClassGroup[],
  profile: SchoolProfile,
  previousSlots: ScheduleSlot[] = [],
  dirtyClassIds: string[] = [], 
  onProgress?: (msg: string) => void,
  isDemo: boolean = false
): Promise<{ slots: ScheduleSlot[], validation: { success: boolean, issues: string[] } }> => {
  
  const isIncremental = dirtyClassIds.length > 0 && previousSlots.length > 0;
  const classesToProcess = isIncremental ? classes.filter(c => dirtyClassIds.includes(c.id)) : classes;
  let runningSlots: ScheduleSlot[] = isIncremental ? previousSlots.filter(s => !dirtyClassIds.includes(s.classId)) : [];

  if (onProgress) onProgress("Initializing Sequential Logic Engine...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const batchSize = 1; 
  for (let i = 0; i < classesToProcess.length; i += batchSize) {
    const currentBatch = classesToProcess.slice(i, i + batchSize);
    const className = currentBatch[0].name;
    
    if (onProgress) onProgress(`Drafting schedule for ${className}...`);

    const busyMap = runningSlots.reduce((acc: any, s) => {
      const key = `Day${s.day}_P${s.period}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s.teacherId);
      return acc;
    }, {});

    const noFlyZones = lockedSlots.reduce((acc: any, l) => {
      const key = `Day${l.dayOfWeek}_P${l.period}`;
      if (l.isSchoolWide || currentBatch.some(c => l.classIds.includes(c.id))) {
        acc[key] = l.name;
      }
      return acc;
    }, {});

    const draftPrompt = `
      ${SYSTEM_DIRECTIVE}
      
      INSTITUTIONAL BOUNDARIES:
      - Total Periods: ${profile.hours.totalPeriods}
      - NO-FLY ZONES (BLOCKED): ${JSON.stringify(noFlyZones)}
      - TEACHER BUSY MAP: ${JSON.stringify(busyMap)}

      TARGET CLASS: ${className} (ID: ${currentBatch[0].id})
      
      REQUIRED LESSONS:
      ${JSON.stringify(currentBatch[0].assignments.map(a => ({
        subjectId: a.subjectId,
        teacherId: a.teacherId,
        freq: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek || 5
      })))}

      TASK: Provide a 5-day schedule (Day 0-4). Spread lessons. Don't start with Period 1 every day.
      Output JSON: { "slots": [{ "day": 0, "period": 0, "classId": "...", "subjectId": "...", "teacherId": "..." }] }
    `;

    try {
      const response = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: draftPrompt,
        config: { responseMimeType: "application/json" }
      }));
      const result = JSON.parse(sanitizeJson(response.text || '{"slots":[]}'));
      const newSlots = (result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
      runningSlots = [...runningSlots, ...newSlots];
    } catch (e) {
      console.error(`Failed to draft for ${className}`, e);
    }
  }

  const issues = validateScheduleProgrammatically(runningSlots, teachers, classes, profile, lockedSlots);
  if (issues.length === 0) {
    return { slots: runningSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} logic overlaps...`);

  const weaverPrompt = `
    ${SYSTEM_DIRECTIVE}
    ERRORS IDENTIFIED: ${issues.slice(0, 50).join("\n")}
    CURRENT PLAN: ${JSON.stringify(runningSlots)}
    TASK: Re-weave to fix overlaps and lock violations. Return { "slots": [...] }
  `;

  try {
    const weaverResponse = await callWithRetry(() => ai.models.generateContent({
      model: isDemo ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview',
      contents: weaverPrompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: isDemo ? 2000 : 16000 }
      }
    }));
    const result = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
    const finalSlots = result.slots && result.slots.length > 0 ? result.slots : runningSlots;
    const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);
    return { slots: finalSlots, validation: { success: finalIssues.length === 0, issues: finalIssues } };
  } catch (error) {
    return { slots: runningSlots, validation: { success: false, issues: issues } };
  }
};

export const analyzeSchedule = async (
  schedule: SchoolSchedule,
  profile: SchoolProfile,
  teachers: Teacher[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze schedule for burnout and coverage: ${JSON.stringify(schedule.weeklySlots.slice(0, 50))}. Output JSON with score and insights.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
