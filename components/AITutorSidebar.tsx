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
    { role: 'model', text: `Hi ${user.name}! 👋 I'm your LearnEye assistant. Stuck on something? I'm here to clarify any doubts about ${course?.topic || 'your studies'} in ${user.language}!` }
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
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting. Could you try that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((para, i) => {
      if (para.trim().startsWith('*') || para.trim().startsWith('-')) {
        return <li key={i} className="ml-4 mb-1 text-slate-900 font-medium leading-relaxed">{para.trim().substring(1).trim()}</li>;
      }
      return <p key={i} className="mb-3 last:mb-0 text-slate-900 font-medium leading-relaxed">{para}</p>;
    });
  };

  return (
    <>
      {/* Floating Action Button - Clean and unobtrusive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 p-5 rounded-full shadow-[0_15px_35px_-5px_rgba(8,145,178,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center bg-gradient-to-br from-cyan-600 to-blue-700 text-white border border-white/20"
        >
          <Icons.Brain className="w-8 h-8 animate-float" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[450px] bg-white shadow-[-25px_0_80px_-20px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-out transform flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header - Professional with clear close action */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
               <Logo size="sm" animated={false} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-none">LearnEye Buddy</h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-cyan-600 mt-1">Intelligent Support</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="group p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-all duration-200"
            aria-label="Close Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Chat Messages - High contrast and legible */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
              <div className={`max-w-[85%] p-4 rounded-[1.75rem] text-[15px] shadow-sm ${
                m.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-br-none font-bold shadow-cyan-900/10' 
                : 'bg-white text-slate-900 rounded-bl-none border border-slate-200 shadow-slate-200/50'
              }`}>
                {m.role === 'model' ? formatText(m.text) : m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white px-5 py-4 rounded-3xl animate-pulse flex space-x-2 border border-slate-100 shadow-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animation-delay-400"></div>
              </div>
            </div>
          )}
        </div>

        {/* Improved Input Area - High Visibility and Clean Layout */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="relative flex items-center bg-white rounded-3xl border-2 border-slate-200 shadow-sm focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/5 transition-all duration-200 group overflow-hidden">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent outline-none text-[15px] py-4 pl-6 pr-14 font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-3 bg-cyan-600 text-white rounded-2xl hover:bg-cyan-700 disabled:opacity-20 disabled:scale-95 transition-all shadow-lg active:scale-90"
            >
              <Icons.Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col items-center space-y-2">
            <p className="text-[10px] text-slate-400 text-center uppercase font-black tracking-[0.2em]">
              Personalized Insights <span className="text-slate-300">|</span> Powered by Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop for focus */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] transition-opacity duration-500"
        />
      )}
    </>
  );
};
