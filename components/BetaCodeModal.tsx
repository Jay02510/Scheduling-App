
import React, { useState } from 'react';
import { Language } from '../types';
import { redeemBetaCode } from '../services/firebase';

interface BetaCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  language: Language;
  onSuccess: () => void;
}

const BetaCodeModal: React.FC<BetaCodeModalProps> = ({ isOpen, onClose, userId, language, onSuccess }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await redeemBetaCode(userId, code.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message === 'Beta Full' 
        ? (language === 'ko' ? '베타 정원이 가득 찼습니다.' : 'Beta recruitment is full.')
        : (language === 'ko' ? '유효하지 않은 코드입니다.' : 'Invalid invite code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKo = language === 'ko';

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-slate-900 rounded-[3rem] border-2 border-sky-500/30 shadow-[0_0_100px_rgba(14,165,233,0.1)] overflow-hidden animate-fadeInUp">
        <div className="p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 mx-auto mb-4 border border-sky-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">{isKo ? '베타 액세스 활성화' : 'Activate Beta Access'}</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{isKo ? '기관용 인텔리전스 코드 입력' : 'Enter Institutional Invite Code'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <input 
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white font-mono text-center text-lg tracking-[0.5em] placeholder:text-slate-800 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 outline-none transition-all uppercase"
                placeholder="XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mt-2">{error}</p>}
            </div>

            <button 
              disabled={isSubmitting}
              className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                (isKo ? '액세스 권한 요청' : 'Request Access')
              )}
            </button>
            
            <p className="text-[8px] text-slate-600 font-bold text-center uppercase tracking-widest leading-relaxed">
              {isKo 
                ? '베타 코드는 한정된 40명의 교육 행정가에게만 제공됩니다.' 
                : 'Limited to 40 institutional administrators globally.'}
            </p>
          </form>
        </div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default BetaCodeModal;
