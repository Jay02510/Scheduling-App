export interface SchoolLevel {
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
  textbookId?: string;
  // Added missing constraints property used in Onboarding.tsx
  constraints?: {
    morningOnly?: boolean;
  };
}

export interface Textbook {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  totalChapters: number;
  totalPages: number;
  currentPage?: number;
}

export interface Teacher {
  id: string;
  name: string;
  role: 'homeroom' | 'korean' | 'subject';
  subjects: string[];
  maxDailyPeriods: number;
  breaksNeededPerWeek: number;
  color: string;
  // Added missing properties used in Onboarding.tsx
  assignedClasses: string[];
  employmentType: string;
}

export interface FixedClass {
  id: string;
  name: string;
  dayOfWeek: number;
  period: number;
  classIds: string[]; 
  isSchoolWide: boolean; 
  color?: string;
}

export interface ClassSubjectAssignment {
  subjectId: string;
  teacherId: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  homeroomTeacherId: string;
  // Added missing property used in Onboarding.tsx
  koreanTeacherId: string;
  assignments: ClassSubjectAssignment[];
  color: string;
}

export interface ScheduleSlot {
  id: string;
  period: number;
  day: number;
  subjectId: string; // Changed to ID-based
  teacherId: string;
  classId: string;
  // Optional topic for visual display
  topic?: string;
  // Optional subject name for visual display
  subject?: string;
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

export interface SchoolHours {
  startTime: string; 
  totalPeriods: number; 
  lunchAfterPeriod: number;
  // Added missing properties used in Onboarding.tsx
  periodDuration: number;
  recessAfterPeriod: number;
  homeworkAfterPeriod: number;
  dailyConfigs: { day: number; endTime: string }[];
}

export interface SchoolProfile {
  name: string;
  hours: SchoolHours;
  // Added missing levels and terms used in Onboarding.tsx
  levels: SchoolLevel[];
  terms: Term[];
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  teachers: Teacher[];
  classes: ClassGroup[];
  fixedClasses: FixedClass[];
  specialEvents: SchoolEvent[];
}