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
  aiNotes?: string;
  constraints?: {
    morningOnly?: boolean;
    requiresSpecialRoom?: string;
    doublePeriod?: boolean;
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
  assignedClasses: string[];
  availabilityNotes?: string;
  employmentType: 'full-time' | 'part-time';
  breaksNeededPerWeek: number;
  color: string;
}

export interface FixedClass {
  id: string;
  name: string;
  provider: string;
  dayOfWeek: number;
  period: number;
  classIds: string[]; 
  isSchoolWide: boolean; 
  room?: string;
  notes?: string;
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
  koreanTeacherId?: string;
  assignments: ClassSubjectAssignment[];
  color: string;
}

export interface ScheduleSlot {
  id: string;
  period: number;
  day: number;
  subject: string;
  teacherId: string;
  classId: string;
  isFixed: boolean;
  isBreak: boolean;
  topic?: string;
}

export interface WeeklyCurriculumTarget {
  weekNumber: number;
  subject: string;
  unit: string;
  pages: string;
  isHolidayWeek?: boolean;
  holidayName?: string;
}

export interface QuarterlyPlan {
  quarterName: string;
  weeks: WeeklyCurriculumTarget[];
}

export interface SchoolSchedule {
  quarterlyPlan: QuarterlyPlan;
  weeklySlots: ScheduleSlot[];
}

export interface DayConfig {
  day: number;
  endTime: string;
}

export interface SchoolHours {
  startTime: string; 
  periodDuration: number; 
  totalPeriods: number; 
  lunchAfterPeriod: number; // The period index after which lunch occurs
  recessAfterPeriod: number;
  homeworkAfterPeriod: number;
  dailyConfigs: DayConfig[];
}

export interface SchoolProfile {
  name: string;
  hours: SchoolHours;
  levels: SchoolLevel[];
  terms: Term[];
  specialEvents: SchoolEvent[];
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  teachers: Teacher[];
  classes: ClassGroup[];
  fixedClasses: FixedClass[];
}