
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
  color?: string;
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
  assignedQuarter?: number; // 0: Q1, 1: Q2, 2: Q3, 3: Q4
  color?: string;
}

export interface Teacher {
  id: string;
  name: string;
  role: 'homeroom' | 'specialist' | 'subject' | 'korean';
  subjects: string[];
  maxDailyPeriods: number;
  breaksNeededPerWeek: number;
  color: string;
  assignedClasses: string[];
  employmentType: string;
}

export interface LockedSlot {
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
  textbookId?: string;
  semesterFocus?: 'S1' | 'S2' | 'Both';
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  homeroomTeacherId: string;
  koreanTeacherId?: string;
  assignments: ClassSubjectAssignment[];
  color: string;
  isCurriculumOnboarded?: boolean;
}

export interface ScheduleSlot {
  id: string;
  period: number;
  day: number;
  subjectId: string;
  teacherId: string;
  classId: string;
  topic?: string;
  isManualOverride?: boolean;
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
  periodDuration: number;
  recessAfterPeriod?: number;
  homeworkAfterPeriod?: number;
  dailyConfigs?: { day: number; endTime: string }[];
}

export interface SchoolProfile {
  name: string;
  hours: SchoolHours;
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  teachers: Teacher[];
  classes: ClassGroup[];
  lockedSlots: LockedSlot[];
  specialEvents: SchoolEvent[];
  specialInstructions?: string; 
}
