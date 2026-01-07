export interface SchoolEvent {
  id: string;
  name: string;
  date: string;
  type: 'holiday' | 'event' | 'half-day';
  description?: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  frequencyPerWeek: number;
  gradeLevels: string[];
  textbookId?: string; // For curriculum mapping
  constraints?: { morningOnly?: boolean }; // For scheduling logic
}

export interface Textbook {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  totalChapters: number;
  totalPages: number;
  currentPage?: number;
  classId?: string; 
}

export interface Teacher {
  id: string;
  name: string;
  role: 'homeroom' | 'specialist' | 'subject' | 'korean'; // Added 'korean'
  subjects: string[];
  maxDailyPeriods: number;
  breaksNeededPerWeek: number;
  color: string;
  assignedClasses: string[];
  employmentType: string;
  preferences?: { prefersMornings: boolean; maxConsecutivePeriods: number }; // Added for preferences
}

export interface LockedSlot {
  id: string;
  name: string;
  dayOfWeek: number;
  period: number;
  classIds: string[]; 
  isSchoolWide: boolean; 
  color?: string;
  provider?: string; // Added for Onboarding
}

// FixedClass is used in some components interchangeably with LockedSlot
export type FixedClass = LockedSlot;

export interface ClassSubjectAssignment {
  subjectId: string;
  teacherId: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  homeroomTeacherId: string;
  koreanTeacherId?: string; // Added for Korean teacher mapping
  assignments: ClassSubjectAssignment[];
  color: string;
}

export interface ScheduleSlot {
  id: string;
  period: number;
  day: number;
  subjectId: string;
  teacherId: string;
  classId: string;
  topic?: string; // For syllabus tracking
}

export interface WeeklyCurriculumTarget {
  weekNumber: number;
  subject: string;
  unit: string;
  pages: string;
  isHolidayWeek?: boolean;
}

export interface QuarterlyPlan {
  quarterName: string;
  weeks: WeeklyCurriculumTarget[];
}

export interface SchoolSchedule {
  quarterlyPlan: QuarterlyPlan;
  weeklySlots: ScheduleSlot[];
}

export interface DailyConfig {
  day: number;
  endTime: string;
}

export interface SchoolHours {
  startTime: string; 
  totalPeriods: number; 
  lunchAfterPeriod: number;
  periodDuration: number;
  recessAfterPeriod?: number; // Added for Onboarding
  homeworkAfterPeriod?: number; // Added for Onboarding
  dailyConfigs?: DailyConfig[]; // Added for Onboarding
}

export interface Level {
  id: string;
  name: string;
  grades: string[];
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface SchoolProfile {
  name: string;
  hours: SchoolHours;
  levels?: Level[]; // Added for Onboarding
  terms?: Term[]; // Added for Onboarding
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  teachers: Teacher[];
  classes: ClassGroup[];
  lockedSlots: LockedSlot[];
  fixedClasses: FixedClass[]; // Added for Onboarding compatibility
  specialEvents: SchoolEvent[];
}