
import React from 'react';
import { Language } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  type: 'privacy' | 'terms' | 'compliance';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, language, type }) => {
  if (!isOpen) return null;

  const content = {
    privacy: {
      title: { en: "Privacy Policy", ko: "개인정보 처리방침" },
      body: {
        en: `
          ### 1. Information Collection
          EduPlanner Pro collects essential data to provide scheduling services, including administrator email addresses, school faculty names, and curriculum structures.

          ### 2. Use of Data
          Your data is used exclusively to generate institutional schedules. We leverage Google's Gemini AI to process scheduling logic. Data sent to the AI is anonymized where possible and used only for your session.

          ### 3. Data Storage
          All school data is stored securely using Firebase (Google Cloud). We utilize industry-standard encryption for data at rest and in transit.

          ### 4. Right to Deletion
          Users maintain full ownership of their data. You can perform a "Factory Reset" in the Settings panel to permanently erase all institutional records from our cloud storage.
        `,
        ko: `
          ### 1. 정보 수집
          EduPlanner Pro는 시간표 서비스를 제공하기 위해 관리자 이메일 주소, 학교 교직원 성함, 교육과정 구조를 포함한 필수 데이터를 수집합니다.

          ### 2. 데이터 사용
          귀하의 데이터는 전적으로 교육기관의 시간표를 생성하는 데 사용됩니다. Google Gemini AI를 활용하여 시간표 로직을 처리하며, AI로 전송되는 데이터는 가능한 경우 익명화되어 해당 세션에만 사용됩니다.

          ### 3. 데이터 저장
          모든 학교 데이터는 Firebase(Google Cloud)를 통해 안전하게 저장됩니다. 저장된 데이터와 전송 중인 데이터 모두 업계 표준 암호화 방식을 적용합니다.

          ### 4. 삭제 권한
          사용자는 자신의 데이터에 대한 모든 소유권을 가집니다. 설정 패널의 "공장 초기화" 기능을 통해 클라우드 저장소에서 모든 기관 기록을 영구적으로 삭제할 수 있습니다.
        `
      }
    },
    terms: {
      title: { en: "Terms of Service", ko: "이용약관" },
      body: {
        en: `
          ### 1. Service Provision
          EduPlanner Pro is an AI-assisted tool designed to support school administrators. Final verification of all schedules remains the responsibility of the institutional head.

          ### 2. User Responsibility
          You are responsible for ensuring the accuracy of teacher requirements and curriculum constraints entered into the system.

          ### 3. Limitation of Liability
          While our "Guardian" logic engine strives for 100% accuracy, we are not liable for operational disruptions caused by schedule errors. Always perform a manual audit before publishing.

          ### 4. Subscription
          Free tier users have access to core scheduling features. Institutional tier users receive premium AI processing and priority support.
        `,
        ko: `
          ### 1. 서비스 제공
          EduPlanner Pro는 학교 관리자를 지원하기 위해 설계된 AI 보조 도구입니다. 모든 시간표의 최종 확인 책임은 해당 교육기관의 장에게 있습니다.

          ### 2. 사용자의 책임
          시스템에 입력된 교사 요구사항 및 교육과정 제약 조건의 정확성을 확인할 책임은 사용자에게 있습니다.

          ### 3. 책임의 한계
          당사의 "Guardian" 로직 엔진은 100% 정확도를 목표로 하지만, 시간표 오류로 인한 운영 차질에 대해 당사는 책임을 지지 않습니다. 게시하기 전에 항상 수동 검토를 수행하십시오.

          ### 4. 구독 및 이용
          무료 티어 사용자는 핵심 시간표 기능을 사용할 수 있습니다. 기관 티어 사용자는 프리미엄 AI 처리 및 우선 지원을 제공받습니다.
        `
      }
    },
    compliance: {
      title: { en: "Legal Compliance", ko: "법적 준수" },
      body: {
        en: `
          ### 1. GDPR & International Standards
          EduPlanner Pro adheres to GDPR principles, ensuring data portability and the right to be forgotten.

          ### 2. PIPA (South Korea)
          For our users in South Korea, we comply with the Personal Information Protection Act (PIPA), handling educational data with the highest sensitivity.

          ### 3. AI Ethics
          Our use of Google Gemini AI follows strict ethical guidelines. We do not use user-specific school data to train global AI models.
        `,
        ko: `
          ### 1. GDPR 및 국제 표준
          EduPlanner Pro는 데이터 이식성 및 잊혀질 권리를 보장하는 GDPR 원칙을 준수합니다.

          ### 2. 개인정보보호법 (대한민국)
          대한민국 사용자를 위해 개인정보보호법(PIPA)을 준수하며, 교육 데이터를 최고 수준의 민감도로 취급합니다.

          ### 3. AI 윤리
          Google Gemini AI의 사용은 엄격한 윤리 지침을 따릅니다. 당사는 글로벌 AI 모델을 학습시키기 위해 사용자별 학교 데이터를 사용하지 않습니다.
        `
      }
    }
  };

  const selectedContent = content[type];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[3rem] border-4 border-slate-900 shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[80vh]">
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedContent.title[language]}</h3>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Institutional Governance Documents</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-10 overflow-y-auto custom-scrollbar prose prose-slate max-w-none">
          <div className="space-y-6 text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
            {selectedContent.body[language]}
          </div>
        </div>
        <footer className="p-6 bg-slate-50 border-t flex justify-end">
           <button onClick={onClose} className="px-8 py-3 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Understood</button>
        </footer>
      </div>
    </div>
  );
};

export default LegalModal;
