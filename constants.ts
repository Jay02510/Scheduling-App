
import { Language } from './types';

export const PERIODS_PER_DAY = 8;
export const DAYS_PER_WEEK = 5;

export const TEACHER_COLORS = [
  '#4ade80', // Lime
  '#60a5fa', // Blue
  '#f472b6', // Pink
  '#fb7185', // Red
  '#fbbf24', // Yellow
  '#a78bfa', // Purple
  '#2dd4bf', // Cyan
  '#f97316', // Orange
  '#94a3b8'  // Slate
];

export const CLASS_COLORS = [
  '#dcfce7', // Light Lime
  '#dbeafe', // Light Blue
  '#fce7f3', // Light Pink
  '#ffe4e6', // Light Red
  '#fef3c7', // Light Yellow
  '#f3e8ff'  // Light Purple
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Home",
    setup: "Set Up",
    homerooms: "Schedules",
    curriculum: "Lessons",
    faculty: "Teachers",
    settings: "Settings",
    school_hub: "Dashboard",
    staff: "Teachers",
    classes: "Classes",
    books: "Materials",
    readiness: "Progress",
    sync_engine: "AI Ready",
    sync_infra: "Update Plan",
    classroom_hub: "All Classes",
    faculty_registry: "All Teachers",
    live_index: "List",
    executive_summary: "Overview",
    operational_health: "Plan Status",
    logic_integrity: "Schedule Check",
    configure_infra: "Edit Plan",
    homeroom_portal: "Class Schedules",
    export_pdf: "Save as PDF",
    period: "Period",
    clash_detected: "Schedule Conflict",
    ai_fix: "Auto Fix",
    institution_grid: "Weekly Plan",
    academic_stream: "Subject",
    semester_1: "Term 1",
    semester_2: "Term 2",
    quarter_1: "Quarter 1",
    quarter_2: "Quarter 2",
    quarter_3: "Quarter 3",
    quarter_4: "Quarter 4",
    resource_pool: "Book List",
    register_resource: "Add New Book",
    confirm_setup: "Done",
    rest: "Break",
    daily_rhythm: "Time Slots",
    ai_tuning: "Custom Rules",
    special_considerations: "Special Instructions",
    global_engagements: "Blocked Times",
    modify_lesson: "Edit Lesson",
    clear_slot: "Clear Slot",
    close_menu: "Close",
    deactivate_faculty: "Remove Teacher",
    delete_group: "Remove Class",
    start_time: "Start Time",
    lesson_duration: "Lesson Length",
    total_slots: "Total Lessons",
    rest_slots: "Weekly Breaks",
    contract_constraints: "Requirements",
    role: "Job Role",
    max_periods: "Max Daily Lessons",
    mapping_staff: "Assign Teacher",
    freq_per_week: "times/week",
    add_subject: "Add Subject",
    confirmation_resync: "No changes detected. Update anyway?",
    sync_initializing: "Updating your school plan...",
    synchronized: "Saved",
    local_changes: "Editing (Unsaved)",
    audit_engine: "Plan Review",
    strategic_report: "Report",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    compliance: "Compliance",
    legal: "Legal"
  },
  ko: {
    dashboard: "홈",
    setup: "설정",
    homerooms: "시간표",
    curriculum: "수업 계획",
    faculty: "선생님",
    settings: "관리",
    school_hub: "대시보드",
    staff: "선생님",
    classes: "학급",
    books: "교재",
    readiness: "진행률",
    sync_engine: "AI 준비됨",
    sync_infra: "계획 업데이트",
    classroom_hub: "모든 학급",
    faculty_registry: "모든 선생님",
    live_index: "목록",
    executive_summary: "개요",
    operational_health: "상태",
    logic_integrity: "시간표 체크",
    configure_infra: "계획 수정",
    homeroom_portal: "반별 시간표",
    export_pdf: "PDF 저장",
    period: "교시",
    clash_detected: "시간 중복",
    ai_fix: "자동 수정",
    institution_grid: "주간 계획",
    academic_stream: "과목",
    semester_1: "1학기",
    semester_2: "2학기",
    quarter_1: "1분기",
    quarter_2: "2분기",
    quarter_3: "3분기",
    quarter_4: "4분기",
    resource_pool: "교재 목록",
    register_resource: "교재 추가",
    confirm_setup: "완료",
    rest: "쉬는 시간",
    daily_rhythm: "수업 시간",
    ai_tuning: "사용자 규칙",
    special_considerations: "특별 요청",
    global_engagements: "고정 일정",
    modify_lesson: "수업 수정",
    clear_slot: "삭제",
    close_menu: "닫기",
    deactivate_faculty: "선생님 삭제",
    delete_group: "학급 삭제",
    start_time: "시작 시간",
    lesson_duration: "수업 길이",
    total_slots: "총 교시",
    rest_slots: "주간 휴식",
    contract_constraints: "요청 사항",
    role: "역할",
    max_periods: "하루 최대 수업",
    mapping_staff: "선생님 배정",
    freq_per_week: "주당 횟수",
    add_subject: "과목 추가",
    confirmation_resync: "변경된 내용이 없습니다. 다시 업데이트할까요?",
    sync_initializing: "계획 업데이트 중...",
    synchronized: "저장됨",
    local_changes: "수정 중 (저장 안 됨)",
    audit_engine: "계획 검토",
    strategic_report: "보고서",
    privacy_policy: "개인정보 처리방침",
    terms_of_service: "이용약관",
    compliance: "법적 준수",
    legal: "법적 고지"
  }
};
