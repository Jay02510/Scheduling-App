
import { Language } from './types';

export const PERIODS_PER_DAY = 8;
export const DAYS_PER_WEEK = 5;

export const TEACHER_COLORS = [
  '#4ade80', // Zest Lime
  '#60a5fa', // Apex Blue
  '#f472b6', // Seraphic Pink
  '#fb7185', // Blossom Red
  '#fbbf24', // Miracle Yellow
  '#a78bfa', // Blast Purple
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
    dashboard: "Dashboard",
    setup: "Setup Center",
    homerooms: "Homerooms",
    curriculum: "Curriculum Map",
    faculty: "Faculty",
    settings: "Settings & Audit",
    school_hub: "School Hub",
    staff: "Staff",
    classes: "Classes",
    books: "Books",
    readiness: "Readiness",
    sync_engine: "Engine v2.5 Online",
    sync_infra: "Sync Infrastructure",
    classroom_hub: "Classroom Hub",
    faculty_registry: "Faculty Registry",
    live_index: "Live Index",
    executive_summary: "Executive Summary",
    operational_health: "Operational Health",
    logic_integrity: "Logic Integrity",
    configure_infra: "Configure Infrastructure",
    homeroom_portal: "Homeroom Portal",
    export_pdf: "Export PDF",
    period: "Period",
    clash_detected: "Pedagogical Clash Detected",
    ai_fix: "AI Fix",
    institution_grid: "Institution Grid",
    academic_stream: "Academic Stream",
    semester_1: "Semester 1 Focus",
    semester_2: "Semester 2 Focus",
    quarter_1: "1st Quarter",
    quarter_2: "2nd Quarter",
    quarter_3: "3rd Quarter",
    quarter_4: "4th Quarter",
    resource_pool: "Resource Pool",
    register_resource: "Register New Resource",
    confirm_setup: "Confirm Setup",
    rest: "Rest",
    daily_rhythm: "Daily Rhythm",
    ai_tuning: "AI Tuning",
    special_considerations: "AI Special Considerations",
    global_engagements: "Master Engagements",
    modify_lesson: "Modify Lesson",
    clear_slot: "Clear Slot",
    close_menu: "Close Menu",
    deactivate_faculty: "Deactivate Faculty File",
    delete_group: "Delete Institutional Group",
    start_time: "School Start Time",
    lesson_duration: "Lesson Duration",
    total_slots: "Total Daily Slots",
    rest_slots: "Guaranteed Weekly Rest Slots",
    contract_constraints: "Contract Constraints",
    role: "Assigned Role",
    max_periods: "Max Daily Periods",
    mapping_staff: "Mapping Staff",
    freq_per_week: "per week",
    add_subject: "Add Subject",
    confirmation_resync: "Configuration identical to last sync. Force re-synchronization?",
    sync_initializing: "Initializing Parallel Infrastructure Sync...",
    synchronized: "System State: Synchronized",
    local_changes: "Drafting Phase: Local Changes Detected",
    audit_engine: "AI Audit Engine",
    strategic_report: "Strategic Report"
  },
  ko: {
    dashboard: "대시보드",
    setup: "설정 센터",
    homerooms: "홈룸 포털",
    curriculum: "교과 과정 맵",
    faculty: "교직원 명부",
    settings: "설정 및 감사",
    school_hub: "학교 허브",
    staff: "교직원",
    classes: "학급",
    books: "교재",
    readiness: "준비도",
    sync_engine: "엔진 v2.5 가동 중",
    sync_infra: "인프라 동기화",
    classroom_hub: "교실 허브",
    faculty_registry: "교직원 레지스트리",
    live_index: "실시간 인덱스",
    executive_summary: "경영 요약",
    operational_health: "운영 상태",
    logic_integrity: "로직 무결성",
    configure_infra: "인프라 구성",
    homeroom_portal: "홈룸 포털",
    export_pdf: "PDF 내보내기",
    period: "교시",
    clash_detected: "교육적 충돌 감지됨",
    ai_fix: "AI 수정",
    institution_grid: "기관 그리드",
    academic_stream: "학업 스트림",
    semester_1: "1학기 집중",
    semester_2: "2학기 집중",
    quarter_1: "1분기",
    quarter_2: "2분기",
    quarter_3: "3분기",
    quarter_4: "4분기",
    resource_pool: "리소스 풀",
    register_resource: "새 리소스 등록",
    confirm_setup: "설정 확인",
    rest: "휴식",
    daily_rhythm: "일과 리듬",
    ai_tuning: "AI 튜닝",
    special_considerations: "AI 특별 고려 사항",
    global_engagements: "마스터 일정",
    modify_lesson: "수업 수정",
    clear_slot: "슬롯 비우기",
    close_menu: "메뉴 닫기",
    deactivate_faculty: "교직원 파일 비활성화",
    delete_group: "기관 그룹 삭제",
    start_time: "학교 시작 시간",
    lesson_duration: "수업 시간",
    total_slots: "일일 총 슬롯",
    rest_slots: "보장된 주간 휴식 슬롯",
    contract_constraints: "계약 제약 조건",
    role: "할당된 역할",
    max_periods: "일일 최대 교시",
    mapping_staff: "담당 교사 매핑",
    freq_per_week: "주당 횟수",
    add_subject: "과목 추가",
    confirmation_resync: "구성이 이전 동기화와 동일합니다. 강제로 다시 동기화하시겠습니까?",
    sync_initializing: "병렬 인프라 동기화 초기화 중...",
    synchronized: "시스템 상태: 동기화됨",
    local_changes: "초안 단계: 로컬 변경 사항 감지됨",
    audit_engine: "AI 감사 엔진",
    strategic_report: "전략적 보고서"
  }
};
