
import React, { useState, useRef, useEffect } from 'react';
import { Icons, COLORS } from '../constants';
import { UserProfile, Course } from '../types';
import { getTutorResponse } from '../services/gemini';
import { Logo } from './Logo';

interface AITutorSidebarProps {
  user: UserProfile;
  course?: Course | null;
}

export const AITutorSidebar: React.FC<AITutorSidebarProps> = ({ user, course }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Hi ${user.name}! 👋 I'm your LearnEye Buddy. I've designed your learning path for ${course?.topic || 'your chosen topic'}. If any concept feels complex, just ask and I'll break it down for you!` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getTutorResponse(userMsg, {
        topic: course?.topic || user.goal,
        persona: user.persona,
        language: user.language,
        history: messages
      });
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Apologies, I hit a brief connection snag. Could you repeat that for me?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
        return <li key={i} className="ml-5 mb-2 list-disc">{trimmed.replace(/^[*-\d.]\s*/, '')}</li>;
      }
      return <p key={i} className="mb-3 last:mb-0 leading-relaxed font-medium">{trimmed}</p>;
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-10 right-10 z-[200] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center bg-indigo-600 text-white border border-indigo-400 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icons.Brain className="w-9 h-9 relative z-10" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-slate-950 animate-pulse" />
        </button>
      )}

      <div className={`fixed inset-y-0 right-0 z-[300] w-full sm:w-[500px] bg-slate-950 shadow-[-40px_0_100px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-out transform flex flex-col border-l border-white/5 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        <div className="p-8 bg-slate-900/50 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <Logo size="sm" animated={false} />
            <div>
              <h3 className="font-black text-white text-xl tracking-tight leading-none">Buddy</h3>
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-indigo-400 mt-2">Personal AI Tutor</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-4 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/20 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-6 rounded-[2rem] text-[15px] shadow-2xl relative ${
                m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none font-bold' 
                : 'bg-slate-900/80 text-slate-200 rounded-bl-none border border-white/5'
              }`}>
                {m.role === 'model' ? <div className="tutor-text">{formatText(m.text)}</div> : m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 px-6 py-5 rounded-[2rem] border border-white/5 flex space-x-2">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-900/50 backdrop-blur-3xl border-t border-white/5">
          <div className="relative flex items-center bg-slate-950 rounded-[2rem] border-2 border-white/5 focus-within:border-indigo-500 transition-all shadow-inner overflow-hidden">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a doubt..."
              className="flex-1 bg-transparent outline-none text-base py-5 pl-8 pr-16 font-bold text-white placeholder:text-slate-600"
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping}
              className="absolute right-3 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-xl active:scale-90"
            >
              <Icons.Send className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-4 text-[10px] text-slate-600 text-center uppercase font-black tracking-[0.4em]">Adaptive Support Powered by Gemini</p>
        </div>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] transition-opacity duration-500"
        />
      )}
    </>
  );
};
