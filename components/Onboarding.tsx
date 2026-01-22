
import React, { useState } from 'react';
import { Logo } from './Logo';
import { Persona, UserProfile } from '../types';
import { PERSONA_CONFIG } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const LANGUAGES = [
  { name: 'English', flag: '🇬🇧' },
  { name: 'Español', flag: '🇪🇸' },
  { name: 'Français', flag: '🇫🇷' },
  { name: 'Deutsch', flag: '🇩🇪' },
  { name: 'हिंदी', flag: '🇮🇳' },
  { name: 'Italiano', flag: '🇮🇹' },
  { name: 'Português', flag: '🇵🇹' },
  { name: '中文', flag: '🇨🇳' },
  { name: '日本語', flag: '🇯🇵' },
  { name: '한국어', flag: '🇰🇷' }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    language: 'English',
    persona: Persona.STUDENT,
    goal: '',
    xp: 0,
    level: 1
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950/20">
      <div className="max-w-xl w-full glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex space-x-0.5 bg-slate-900/50">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 transition-all duration-700 ${step >= s ? 'bg-indigo-500' : 'bg-transparent'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8">
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">LearnEye</h1>
              <p className="text-slate-400 font-medium">The eye that sees your learning potential.</p>
            </div>
            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="How should we address you?"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && profile.name?.trim() && nextStep()}
                className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-xl font-bold text-center text-white"
              />
              <button
                onClick={nextStep}
                disabled={!profile.name?.trim()}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-20 active:scale-95"
              >
                Enter the Matrix ✨
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Greetings, {profile.name}! 👋</h2>
              <p className="text-slate-400 font-medium">Select your preferred interaction language.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {LANGUAGES.map(l => (
                <button
                  key={l.name}
                  onClick={() => { setProfile({ ...profile, language: l.name }); nextStep(); }}
                  className={`flex items-center space-x-3 p-4 border-2 rounded-xl transition-all hover:bg-white/5 ${
                    profile.language === l.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-bold text-white">{l.name}</span>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="text-slate-500 font-bold text-sm hover:text-indigo-400 transition-colors">Go Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Define Your Persona</h2>
              <p className="text-slate-400 font-medium">Our tutor adapts its logic to your needs.</p>
            </div>
            <div className="space-y-4">
              {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => { setProfile({ ...profile, persona: key as Persona }); nextStep(); }}
                  className={`w-full flex items-center p-6 border-2 rounded-2xl text-left transition-all hover:bg-white/5 group ${
                    profile.persona === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5'
                  }`}
                >
                  <span className="text-4xl mr-5 transition-transform group-hover:scale-110">{config.icon}</span>
                  <div>
                    <h4 className="font-black text-white text-lg">{key}</h4>
                    <p className="text-sm text-slate-400 font-medium">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="text-slate-500 font-bold text-sm hover:text-indigo-400 transition-colors">Go Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Target Objective 🎯</h2>
              <p className="text-slate-400 font-medium">What knowledge base shall we architect today?</p>
            </div>
            <div className="space-y-6">
              <textarea
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                placeholder="e.g. Modern Web Architecture, Classical Music History, Python Mastery..."
                className="w-full h-40 px-8 py-6 bg-slate-900/50 border-2 border-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-bold text-white shadow-inner placeholder:text-slate-700"
              />
              <div className="flex flex-wrap gap-2">
                {['Quantum Physics', 'Digital Marketing', 'Stock Trading', 'Philosophy'].map(g => (
                  <button
                    key={g}
                    onClick={() => setProfile({ ...profile, goal: g })}
                    className="px-4 py-2 bg-slate-900 border border-white/5 rounded-full text-xs font-bold text-slate-500 hover:text-white hover:border-indigo-500 transition-all"
                  >
                    + {g}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onComplete(profile as UserProfile)}
                disabled={!profile.goal?.trim()}
                className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-indigo-600/20 transition-all hover:scale-[1.02] disabled:opacity-20 active:scale-95"
              >
                Synthesize Learning Path ✨
              </button>
            </div>
            <button onClick={prevStep} className="text-slate-500 font-bold text-sm hover:text-indigo-400 transition-colors">Go Back</button>
          </div>
        )}
      </div>
    </div>
  );
};
