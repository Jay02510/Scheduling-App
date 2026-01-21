
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
  const teacherTimeMap: Record<string, { classId: string, className: string }> = {}; 
  const classSubjectDailyMap: Record<string, number> = {}; 

  slots.forEach(slot => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const classObj = classes.find(c => c.id === slot.classId);
    const className = classObj?.name || "Unknown Class";
    const subName = profile.subjects.find(s => s.id === slot.subjectId)?.name || "Unknown Subject";

    // 1. Teacher Overlap (Double Booking)
    if (!slot.teacherId || slot.teacherId === "undefined") {
      issues.push(`ERROR: Missing teacher assignment for "${subName}" in "${className}".`);
    } else {
      const tKey = `${slot.day}:${slot.period}:${slot.teacherId}`;
      if (teacherTimeMap[tKey] && teacherTimeMap[tKey].classId !== slot.classId) {
        issues.push(`OVERLAP: ${teacher?.name || 'Teacher'} is double-booked for "${className}" and "${teacherTimeMap[tKey].className}" (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
      } else {
        teacherTimeMap[tKey] = { classId: slot.classId, className };
      }
    }

    // 2. Class Subject Duplicates (Same class, same subject, same day)
    const subConfig = profile.subjects.find(s => s.id === slot.subjectId);
    if (subConfig && subConfig.frequencyPerWeek <= 5) {
      const sKey = `${slot.day}:${slot.classId}:${slot.subjectId}`;
      classSubjectDailyMap[sKey] = (classSubjectDailyMap[sKey] || 0) + 1;
      if (classSubjectDailyMap[sKey] > 1) {
        issues.push(`DUPLICATE: ${className} has "${subName}" twice on Day ${slot.day + 1}.`);
      }
    }

    // 3. Locked Slots Conflict
    const lock = lockedSlots.find(l => 
      l.dayOfWeek === slot.day && 
      l.period === slot.period && 
      (l.isSchoolWide || (l.classIds || []).includes(slot.classId))
    );
    if (lock) {
      issues.push(`LOCK: ${className} scheduled during "${lock.name}" (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    }
  });

  return issues;
};

const SYSTEM_DIRECTIVE = `
You are a master school scheduler. Generate a timetable that follows all rules.

RULES:
1. USE EXACT IDs: Use subjectId and teacherId provided.
2. TEMPORAL VARIETY: Subjects do NOT need to be at the same time every day. In fact, varying the time (e.g., Math at 9am Mon, 1pm Tue) is highly encouraged to solve teacher conflicts and fill the afternoon.
3. FILL ALL SLOTS: populate all periods 0 to [Total Periods - 1]. 
4. AFTER-LUNCH IS PRIORITY: Periods after lunch break (Period ${4}+1 etc) must be filled.
5. NO DOUBLE-BOOKING: A teacherId cannot be in two classIds at the same day/period.
6. RESPECT LOCKS: Do not place subjects in 'Global Locked Slots'.
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

  if (onProgress) onProgress("Initializing Intelligence Engine...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (classesToProcess.length === 0) {
    return { slots: previousSlots, validation: { success: true, issues: [] } };
  }

  const batches = [];
  for (let i = 0; i < classesToProcess.length; i += 4) {
    batches.push(classesToProcess.slice(i, i + 4));
  }

  const draftPromises = batches.map(async (batch) => {
    const draftPrompt = `
      ${SYSTEM_DIRECTIVE}
      
      INSTITUTIONAL CONFIG:
      - Total Periods per Day: ${profile.hours.totalPeriods}
      - Lunch occurs AFTER Period: ${profile.hours.lunchAfterPeriod}
      - Global Locked Slots: ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide))}

      TASK: Generate a 5-day schedule for: ${batch.map(c => c.name).join(", ")}.
      
      SUBJECT POOL:
      ${JSON.stringify(batch.map(c => ({
        classId: c.id,
        availableLessons: c.assignments.map(a => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          weeklyFrequency: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek
        }))
      })))}

      IMPORTANT: Spread lessons across the day. DO NOT keep them at the same period every day.
      Return JSON: { "slots": [{ "day": 0, "period": 0, "classId": "...", "subjectId": "...", "teacherId": "..." }] }
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: draftPrompt,
      config: { responseMimeType: "application/json" }
    }));

    const cleaned = sanitizeJson(response.text || '{"slots":[]}');
    try {
      const result = JSON.parse(cleaned);
      return (result.slots || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
    } catch (e) {
      return [];
    }
  });

  const draftResults = await Promise.all(draftPromises);
  const combinedSlots: ScheduleSlot[] = [...preservedSlots, ...draftResults.flat()];

  if (onProgress) onProgress("Checking for conflicts...");
  const issues = validateScheduleProgrammatically(combinedSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    return { slots: combinedSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} conflicts...`);

  const weaverPrompt = `
    ${SYSTEM_DIRECTIVE}
    FIX THESE ERRORS:
    ${issues.join("\n")}
    
    CURRENT FAULTY PLAN: ${JSON.stringify(combinedSlots)}
    
    INSTRUCTION: 
    - Fix teacher overlaps immediately.
    - Vary the time of day for subjects to fit them in.
    - Return FULL corrected JSON list of slots.
  `;

  let finalSlots = combinedSlots;
  try {
    const weaverResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: weaverPrompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 8000 }
      }
    }));
    const result = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
    finalSlots = result.slots || combinedSlots;
  } catch (error: any) {
    finalSlots = combinedSlots;
  }

  const finalIssues = validateScheduleProgrammatically(finalSlots, teachers, classes, profile, lockedSlots);
  return {
    slots: finalSlots,
    validation: { success: finalIssues.length === 0, issues: finalIssues }
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
    contents: `Analyze: ${JSON.stringify(schedule.weeklySlots.slice(0, 50))}. Output JSON with health score and insights.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
