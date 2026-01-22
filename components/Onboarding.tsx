import React, { useState, useMemo } from 'react';
import { Logo } from './Logo';
import { Persona, UserProfile } from '../types';
import { PERSONA_CONFIG } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const ALL_LANGUAGES = [
  { name: 'English', flag: '🇬🇧' },
  { name: 'Kannada', flag: '🇮🇳' },
  { name: 'Tamil', flag: '🇮🇳' },
  { name: 'Malay', flag: '🇲🇾' },
  { name: 'हिंदी', flag: '🇮🇳' },
  { name: 'Español', flag: '🇪🇸' },
  { name: 'Français', flag: '🇫🇷' },
  { name: 'Portuguese', flag: '🇵🇹' },
  { name: 'Deutsch', flag: '🇩🇪' },
  { name: 'Italiano', flag: '🇮🇹' },
  { name: '日本語', flag: '🇯🇵' },
  { name: '한국어', flag: '🇰🇷' },
  { name: '中文', flag: '🇨🇳' },
  { name: 'Русский', flag: '🇷🇺' },
  { name: 'العربية', flag: '🇸🇦' },
  { name: 'Tiếng Việt', flag: '🇻🇳' },
  { name: 'Türkçe', flag: '🇹🇷' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState<Persona>(Persona.STUDENT);
  const [language, setLanguage] = useState('English');
  const [languageSearch, setLanguageSearch] = useState('');
  const [goal, setGoal] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return ALL_LANGUAGES.slice(0, 8);
    return ALL_LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(languageSearch.toLowerCase())
    );
  }, [languageSearch]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <div className="max-w-2xl w-full glass-card rounded-[3rem] shadow-2xl border border-white/10 p-10 md:p-14 transition-all duration-700 relative overflow-hidden">
        
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 flex">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className={`flex-1 transition-all duration-500 ${step >= s ? 'bg-cyan-500' : 'bg-transparent'}`} />
           ))}
        </div>

        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-center mb-6">
              <div className="animate-float">
                <Logo size="xl" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tighter">LearnEye</h1>
              <p className="text-lg text-slate-400 font-medium">Hello! Ready to start your learning journey?</p>
            </div>
            <div className="space-y-4">
              <div className="relative group">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tell me your name"
                  className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/10 rounded-3xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-xl font-medium text-center shadow-inner text-white"
                />
              </div>
              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className="w-full bg-white text-slate-900 font-black py-5 rounded-3xl shadow-2xl hover:scale-[1.02] disabled:opacity-20 disabled:scale-100 transition-all text-lg active:scale-95"
              >
                Let's Go ✨
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Your Language</h2>
              <p className="text-slate-400 font-medium">Which language do you prefer to learn in?</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Search language (e.g. Portuguese)..."
                  className="w-full px-6 py-4 bg-slate-900/50 border-2 border-white/10 rounded-2xl focus:border-cyan-500 outline-none transition-all text-white placeholder:text-slate-500 font-bold"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredLanguages.map((l) => (
                  <button
                    key={l.name}
                    onClick={() => { setLanguage(l.name); handleNext(); }}
                    className={`flex items-center space-x-4 p-4 border-2 rounded-2xl transition-all hover:bg-white/5 ${
                      language === l.name ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-white/5'
                    }`}
                  >
                    <span className="text-2xl">{l.flag}</span>
                    <span className="font-bold text-white text-base">{l.name}</span>
                  </button>
                ))}
                {filteredLanguages.length === 0 && languageSearch.trim() && (
                  <button
                    onClick={() => { setLanguage(languageSearch); handleNext(); }}
                    className="flex items-center space-x-4 p-4 border-2 border-dashed border-cyan-500/50 rounded-2xl bg-cyan-500/5 text-white col-span-full"
                  >
                    <span className="text-2xl">🌐</span>
                    <div className="text-left">
                      <span className="font-bold block">Use "{languageSearch}"</span>
                      <span className="text-xs text-slate-400 font-medium">Set as custom language</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="text-slate-500 font-bold text-sm hover:text-cyan-400 transition-colors">Go Back</button>
              {languageSearch.trim() && (
                <span className="text-xs font-black text-cyan-400/50 uppercase tracking-widest">Searching...</span>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
             <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Your Style</h2>
              <p className="text-slate-400 font-medium">How should I explain things to you?</p>
            </div>
            <div className="space-y-4">
              {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => { setPersona(key as Persona); handleNext(); }}
                  className={`group w-full flex items-center justify-between p-6 border-2 rounded-[2.5rem] text-left transition-all hover:bg-white/5 ${
                    persona === key ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-5">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{config.icon}</span>
                    <div>
                      <h4 className="font-black text-white text-xl">{key}</h4>
                      <p className="text-sm text-slate-400 font-medium">{config.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handleBack} className="text-slate-500 font-bold text-sm hover:text-cyan-400 transition-colors">Go Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">What to Learn?</h2>
              <p className="text-slate-400 font-medium">What topic do you want to master today in <span className="text-cyan-400 font-bold">{language}</span>?</p>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Java basics, Cooking, Physics..."
                  className="w-full h-40 px-8 py-6 bg-slate-900/50 border-2 border-white/10 rounded-[2.5rem] focus:border-cyan-500 outline-none transition-all text-lg font-medium text-white shadow-inner"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {['Creative Writing', 'Web Design', 'Economics', 'Math Mastery'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setGoal(s)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-400 text-[10px] font-black rounded-full border border-white/5 hover:bg-cyan-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => onComplete({ name, persona, language, goal, xp: 0, level: 1 })}
                disabled={!goal.trim()}
                className="w-full bg-cyan-500 text-white font-black py-6 rounded-[2.5rem] shadow-2xl hover:bg-cyan-600 hover:scale-[1.02] disabled:opacity-20 transition-all text-xl active:scale-95 shadow-cyan-500/20"
              >
                Start My Path ✨
              </button>
              <button onClick={handleBack} className="text-slate-500 font-bold text-sm hover:text-cyan-400 transition-colors">Go Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
