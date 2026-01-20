
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, LockedSlot, ClassGroup, SchoolProfile, ScheduleSlot, SchoolSchedule } from "../types";

const sanitizeJson = (text: string) => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  // Attempt to fix trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  // Ensure property names are double-quoted if they aren't
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
    const tKey = `${slot.day}:${slot.period}:${slot.teacherId}`;
    if (teacherTimeMap[tKey] && teacherTimeMap[tKey].classId !== slot.classId) {
      issues.push(`OVERLAP: ${teacher?.name} is double-booked for "${className}" and "${teacherTimeMap[tKey].className}" (Day ${slot.day + 1}, Period ${slot.period + 1}).`);
    } else {
      teacherTimeMap[tKey] = { classId: slot.classId, className };
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
You are EduPlanner’s Institutional Intelligence Engine. 
You must generate a schedule that is operationally perfect and follows all human-sustainability rules.

CRITICAL RULES:
1. USE EXACT IDs: You MUST use the provided subjectId and teacherId. Never invent new IDs or use names as IDs.
2. FULL DAY COVERAGE: You MUST fill all periods from 0 to [Total Periods - 1]. 
3. POST-LUNCH MANDATE: Scheduling does NOT stop at lunch. Periods occurring after the lunch break are high-priority teaching slots. Fill them completely.
4. ZERO-INDEXING: 'day' is 0 (Mon) to 4 (Fri). 'period' is 0 to [Total Periods - 1].
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
      - Lunch occurs AFTER Period: ${profile.hours.lunchAfterPeriod} (Note: Next lesson starts at period ${profile.hours.lunchAfterPeriod + 1})
      - Global Locked Slots (Do not schedule here): ${JSON.stringify(lockedSlots.filter(l => l.isSchoolWide))}

      SPECIAL INSTRUCTIONS:
      "${profile.specialInstructions || "None."}"

      TASK: Generate a 5-day schedule for these classes: ${batch.map(c => c.name).join(", ")}.
      
      VALID SUBJECT POOL FOR THESE CLASSES:
      ${JSON.stringify(batch.map(c => ({
        classId: c.id,
        className: c.name,
        availableLessons: c.assignments.map(a => ({
          subjectId: a.subjectId,
          subjectName: profile.subjects.find(s => s.id === a.subjectId)?.name,
          teacherId: a.teacherId,
          teacherName: teachers.find(t => t.id === a.teacherId)?.name,
          weeklyFrequency: profile.subjects.find(s => s.id === a.subjectId)?.frequencyPerWeek
        }))
      })))}

      IMPORTANT: 
      - Distribute the total weekly frequency for each subject across the 5 days.
      - Ensure periods ${profile.hours.lunchAfterPeriod + 1} to ${profile.hours.totalPeriods - 1} are populated with lessons.
      - Return ONLY a JSON object.

      OUTPUT FORMAT:
      {
        "slots": [
          { "day": 0, "period": 0, "classId": "...", "subjectId": "...", "teacherId": "..." },
          ...
        ]
      }
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
      console.error("JSON Parse Error in Draft:", cleaned);
      return [];
    }
  });

  const draftResults = await Promise.all(draftPromises);
  const combinedSlots: ScheduleSlot[] = [...preservedSlots, ...draftResults.flat()];

  if (onProgress) onProgress("Performing Programmatic Validation...");
  const issues = validateScheduleProgrammatically(combinedSlots, teachers, classes, profile, lockedSlots);
  
  if (issues.length === 0) {
    if (onProgress) onProgress("Logic integrity confirmed.");
    return { slots: combinedSlots, validation: { success: true, issues: [] } };
  }

  if (onProgress) onProgress(`Resolving ${issues.length} conflicts with Deep Reasoning...`);

  const weaverPrompt = `
    ${SYSTEM_DIRECTIVE}
    TASK: Correct the following schedule. It contains double-bookings or missing coverage.
    
    LUNCH BREAK: After Period ${profile.hours.lunchAfterPeriod}.
    TOTAL PERIODS: ${profile.hours.totalPeriods}.
    
    ERRORS TO FIX:
    ${issues.join("\n")}
    
    CURRENT FAULTY PLAN: ${JSON.stringify(combinedSlots)}
    
    INSTRUCTION: 
    - Fix overlaps by moving lessons to empty slots (especially after lunch).
    - Ensure EVERY subject reaches its required weekly frequency.
    - Return the FULL corrected list of slots as JSON.
  `;

  let finalSlots = combinedSlots;
  try {
    const weaverResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: weaverPrompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }
      }
    }));
    const result = JSON.parse(sanitizeJson(weaverResponse.text || '{"slots":[]}'));
    finalSlots = result.slots || combinedSlots;
  } catch (error: any) {
    console.error("Weaver Failure:", error);
    // Fallback if Pro fails
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
    contents: `
      Analyze this institutional schedule for operational health.
      DATA: ${JSON.stringify(schedule.weeklySlots.slice(0, 100))}
      OUTPUT JSON ONLY with keys: score, insights (array), burnoutRisks (object), coverageConfidence, summary, impactLevel, adminExplanation.
    `,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(sanitizeJson(response.text || '{}'));
};
