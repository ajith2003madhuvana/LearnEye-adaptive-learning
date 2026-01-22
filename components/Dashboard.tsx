import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Course, Module, LessonPart, QuizQuestion } from '../types';
import { Icons, COLORS } from '../constants';
import { generateCourseContent } from '../services/gemini';
import { Logo } from './Logo';
import { AITutorSidebar } from './AITutorSidebar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardProps {
  user: UserProfile;
  setUser: (profile: UserProfile | null) => void;
  initialCourse: Course | null;
  onCourseUpdate: (course: Course) => void;
}

const LOADING_STATUSES = [
  "Analyzing your learning goals...",
  "Architecting modular learning path...",
  "Synthesizing real-world examples...",
  "Drafting interactive challenges...",
  "Finalizing your personalized workspace..."
];

export const Dashboard: React.FC<DashboardProps> = ({ user, setUser, initialCourse, onCourseUpdate }) => {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [view, setView] = useState<'roadmap' | 'lesson' | 'quiz' | 'analysis'>('roadmap');
  const [loading, setLoading] = useState(!initialCourse);
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);
  const [quizResults, setQuizResults] = useState<{ score: number, answers: any[] } | null>(null);
  
  const [sessionPoints, setSessionPoints] = useState<{name: string, xp: number}[]>([]);

  useEffect(() => {
    setSessionPoints([{ name: 'Start', xp: user.xp }]);
    
    // Status sequencer for loading screen
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStatusIdx(prev => (prev + 1) % LOADING_STATUSES.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const performanceData = useMemo(() => {
    if (sessionPoints.length < 2) {
      return [{ name: '', xp: Math.max(0, user.xp - 50) }, ...sessionPoints];
    }
    return sessionPoints;
  }, [sessionPoints, user.xp]);

  useEffect(() => {
    if (course) return;

    const loadContent = async () => {
      setLoading(true);
      const data = await generateCourseContent(user.goal, user.persona, user.language);
      if (data && data.modules) {
        const newCourse: Course = {
          id: 'course-' + Date.now(),
          topic: user.goal,
          visualKeyword: data.visualKeyword,
          modules: data.modules.map((m: any, i: number) => ({
            ...m,
            status: i === 0 ? 'current' : 'locked',
            progress: 0
          }))
        };
        setCourse(newCourse);
        onCourseUpdate(newCourse);
      }
      setLoading(false);
    };
    loadContent();
  }, [user.goal, user.persona, user.language, course, onCourseUpdate]);

  const completeModule = (score: number, answers: any[]) => {
    setQuizResults({ score, answers });
    setView('analysis');
  };

  const proceedFromAnalysis = () => {
    if (!course || !quizResults) return;

    const passed = quizResults.score >= 3;
    
    if (passed) {
      const newModules = [...course.modules];
      newModules[activeModuleIndex].status = 'completed';
      newModules[activeModuleIndex].progress = 100;
      
      if (activeModuleIndex + 1 < newModules.length) {
        newModules[activeModuleIndex + 1].status = 'current';
      }
      
      const updatedCourse = { ...course, modules: newModules };
      setCourse(updatedCourse);
      onCourseUpdate(updatedCourse);

      const addedXP = 500;
      const newXP = user.xp + addedXP;
      
      setUser({ ...user, xp: newXP, level: Math.floor(newXP / 1000) + 1 });
      
      setSessionPoints(prev => [...prev, { name: `M${activeModuleIndex + 1}`, xp: newXP }]);
      setView('roadmap');
    } else {
      setView('lesson');
    }
    setQuizResults(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0f172a] z-[1000]">
        <div className="animate-float mb-10"><Logo size="lg" /></div>
        <div className="space-y-6 max-w-lg">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">
              Designing Your Personalized Path...
            </h2>
            <div className="flex justify-center space-x-1">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
            </div>
          </div>
          <div className="h-8">
            <p className="text-indigo-400 text-lg font-bold italic animate-in fade-in slide-in-from-bottom-2 duration-1000 key={loadingStatusIdx}">
              "{LOADING_STATUSES[loadingStatusIdx]}"
            </p>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Preparing a custom curriculum for <b>{user.goal}</b> in <b>{user.language}</b> just for you, {user.name}.
          </p>
        </div>
      </div>
    );
  }

  const activeModule = course?.modules[activeModuleIndex];
  const completedModules = course?.modules.filter(m => m.status === 'completed').length || 0;
  
  const headerBgStyle = course?.visualKeyword ? {
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.85)), url('https://source.unsplash.com/1600x900/?${encodeURIComponent(course.visualKeyword)}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-200">
      <AITutorSidebar user={user} course={course} />

      <nav className="fixed top-0 left-0 right-0 z-[100] glass-panel px-6 md:px-12 py-4 flex items-center justify-between border-b border-white/5 shadow-2xl">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('roadmap')}>
          <Logo size="sm" />
          <span className="font-black text-2xl text-white tracking-tighter group-hover:text-indigo-400 transition-colors">LearnEye</span>
        </div>
        <div className="flex items-center space-x-4 md:space-x-8">
           <div className="hidden sm:flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Level</span>
              <span className="text-lg font-black text-white leading-none">{user.level}</span>
           </div>
           <div className="flex items-center space-x-2 bg-indigo-600 px-5 py-2.5 rounded-2xl shadow-xl shadow-indigo-600/20 text-white font-black text-xs">
              <Icons.Sparkles className="w-4 h-4" />
              <span>{user.xp} XP</span>
           </div>
           <button onClick={() => setUser(null)} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-rose-600 transition-all text-slate-400 hover:text-white">
              <Icons.Rocket className="w-5 h-5 rotate-180" />
           </button>
        </div>
      </nav>

      <div className="flex-1 w-full pt-[84px] flex flex-col">
        
        {view === 'roadmap' && course && (
          <div className="w-full flex flex-col animate-in fade-in duration-700">
            <header className="w-full h-[45vh] relative flex flex-col items-center justify-center text-center px-10 border-b border-white/5" style={headerBgStyle}>
              <div className="max-w-4xl space-y-6">
                <div className="inline-flex items-center px-5 py-2 bg-indigo-600/10 text-indigo-400 rounded-full border border-indigo-500/20 backdrop-blur-3xl">
                   <span className="text-[11px] font-black uppercase tracking-[0.25em]">Personalized Learning Path</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">{course.topic}</h1>
                <p className="text-lg md:text-xl text-slate-300 font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
                   Progress tracking for <b>{user.name}</b>. You have mastered <b>{completedModules}</b> modules.
                </p>
              </div>
            </header>

            <div className="w-full flex-1 px-6 md:px-12 py-16 bg-slate-950/20">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {course.modules.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => { if(m.status !== 'locked') { setActiveModuleIndex(idx); setView('lesson'); } }}
                    disabled={m.status === 'locked'}
                    className={`group relative flex flex-col p-8 rounded-[2.5rem] border-2 h-auto min-h-[320px] transition-all duration-500 text-left ${
                      m.status === 'current' 
                        ? 'border-indigo-500 bg-indigo-600/5 shadow-[0_0_80px_-20px_rgba(79,70,229,0.2)] scale-105 z-10' 
                        : m.status === 'completed'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-white/5 bg-white/2 opacity-20 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 mb-8 ${
                      m.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : m.status === 'current' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {m.status === 'completed' ? <Icons.Check className="w-8 h-8" /> : m.status === 'locked' ? <Icons.Lock className="w-8 h-8" /> : <Icons.Eye className="w-8 h-8 animate-pulse" />}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Module {idx + 1}</span>
                      <h3 className="font-black text-white text-xl tracking-tight leading-tight group-hover:text-indigo-400 transition-colors">{m.title}</h3>
                    </div>

                    <div className={`mt-8 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all text-center ${
                        m.status === 'current' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-transparent text-slate-500 border-white/10 group-hover:border-indigo-500/40 group-hover:text-indigo-400'
                    }`}>
                      {m.status === 'completed' ? 'Review Content' : m.status === 'current' ? 'Start Module' : 'Locked'}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="max-w-7xl mx-auto mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-white flex items-center">
                          <Icons.Chart className="w-7 h-7 mr-4 text-indigo-500" />
                          Mastery Analytics
                       </h3>
                       <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live XP Feed</div>
                    </div>
                    <div className="h-[280px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={performanceData}>
                           <defs>
                             <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                               <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                           <YAxis hide />
                           <Tooltip contentStyle={{ borderRadius: '20px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 700 }} />
                           <Area type="monotone" dataKey="xp" stroke={COLORS.primary} strokeWidth={4} fill="url(#colorXp)" dot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#0f172a' }} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center justify-center h-full">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Current Mastery</p>
                       <div className="relative mb-6">
                          <div className="w-32 h-32 rounded-full border-8 border-slate-800 flex items-center justify-center">
                             <span className="text-4xl font-black text-white">{Math.round((completedModules / (course?.modules.length || 1)) * 100)}%</span>
                          </div>
                          <svg className="absolute top-0 left-0 w-32 h-32 -rotate-90">
                            <circle cx="64" cy="64" r="60" fill="transparent" stroke={COLORS.primary} strokeWidth="8" strokeDasharray={`${Math.round((completedModules / (course?.modules.length || 1)) * 377)} 377`} strokeLinecap="round" />
                          </svg>
                       </div>
                       <p className="text-sm font-bold text-slate-400 leading-relaxed italic">
                         Keep going! You're closer to mastery than you were yesterday.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'lesson' && activeModule?.lesson && (
          <div className="w-full flex-1 bg-slate-950 flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-full h-[35vh] relative flex items-center justify-center overflow-hidden border-b border-white/5" style={headerBgStyle}>
               <button onClick={() => setView('roadmap')} className="absolute top-8 left-8 z-20 px-6 py-3 bg-white/10 hover:bg-indigo-600 backdrop-blur-3xl border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all text-white">
                  ← Back to Roadmap
               </button>
               <div className="relative z-10 text-center space-y-4 max-w-5xl px-10">
                  <div className="flex justify-center"><Logo size="md" /></div>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl">
                    {activeModule.title}
                  </h2>
                  <div className="h-1.5 w-24 bg-indigo-500 mx-auto rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                  <p className="text-sm md:text-base text-indigo-400 font-black uppercase tracking-[0.3em] opacity-90">
                    {activeModule.lesson.objective}
                  </p>
               </div>
            </div>

            <div className="w-full max-w-4xl px-8 py-20 space-y-24">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <h3 className="text-2xl font-black text-white">Introduction</h3>
                    <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20 relative">
                       <div className="absolute -top-3 -left-3 bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Analogy</div>
                       <p className="text-lg font-bold italic text-slate-200 leading-relaxed">
                         "{activeModule.lesson.explanationELI5}"
                       </p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Core Takeaways</h4>
                    <ul className="space-y-4">
                       {activeModule.lesson.keyConcepts.map((k, i) => (
                         <li key={i} className="flex items-start text-base font-bold text-slate-300 leading-relaxed group">
                           <span className="w-3 h-3 bg-indigo-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform" /> {k}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              <div className="space-y-12">
                 <h4 className="text-3xl font-black text-white text-center tracking-tight">Deep Dive</h4>
                 <div className="text-lg text-slate-400 leading-loose font-medium space-y-8 tutor-text">
                    {activeModule.lesson.detailedExplanation.split('\n').map((para, i) => (
                      <p key={i} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>{para}</p>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-12 md:p-16 rounded-[3rem] text-slate-900 shadow-3xl relative overflow-hidden group">
                 <div className="absolute -top-20 -right-20 w-80 h-80 bg-slate-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center space-x-4 mb-2">
                       <span className="text-4xl">🧩</span>
                       <h4 className="text-2xl font-black tracking-tight">Real-World Application</h4>
                    </div>
                    <p className="text-lg font-bold leading-relaxed text-slate-800">
                      {activeModule.lesson.realWorldExample}
                    </p>
                 </div>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-emerald-600/5 border border-emerald-500/20">
                 <h4 className="text-xs font-black text-emerald-400 mb-10 text-center uppercase tracking-[0.4em]">Quick Recap</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {activeModule.lesson.recap.map((point, i) => (
                     <div key={i} className="p-6 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-emerald-500/40 transition-all group">
                        <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><Icons.Check className="w-6 h-6 text-emerald-500" /></div>
                        <span className="text-sm font-bold text-slate-300 leading-snug">{point}</span>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center py-20 border-t border-white/10 space-y-10">
                 <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white">Ready to validate your knowledge?</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em]">Complete the challenge to unlock the next node</p>
                 </div>
                 <button onClick={() => setView('quiz')} className="px-16 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-indigo-600/30 hover:scale-[1.05] transition-all active:scale-95">
                   Take the Challenge →
                 </button>
              </div>
            </div>
          </div>
        )}

        {view === 'quiz' && activeModule?.quiz && (
           <QuizComponent 
             questions={activeModule.quiz} 
             onComplete={completeModule}
             onBack={() => setView('lesson')}
           />
        )}

        {view === 'analysis' && quizResults && activeModule && (
          <div className="w-full flex-1 flex flex-col items-center bg-slate-950 py-20 px-8 animate-in fade-in duration-700">
             <div className="max-w-4xl w-full space-y-16">
               <header className="text-center space-y-6">
                  <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-black shadow-2xl ${quizResults.score >= 3 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                     {quizResults.score}/5
                  </div>
                  <h2 className="text-4xl font-black text-white">{quizResults.score >= 3 ? 'Node Mastered! 🏆' : 'Keep Pushing! 💪'}</h2>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em]">Performance Feedback Report</p>
               </header>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  <div className="space-y-6">
                     <h3 className="text-xl font-black text-white">Detailed Quiz Log</h3>
                     <div className="space-y-4">
                        {quizResults.answers.map((ans, i) => (
                           <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all ${ans.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <p className="text-sm font-black text-white mb-3 leading-tight">Q{i+1}: {ans.question}</p>
                              <p className="text-xs font-medium text-slate-400 leading-relaxed italic border-t border-white/5 pt-3">
                                <b>Feedback:</b> {ans.explanation}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8 sticky top-32">
                     <div className="glass-card p-10 rounded-[3rem] space-y-8 bg-indigo-600/5 border-indigo-500/20">
                        <div className="flex items-center space-x-4">
                           <span className="text-3xl">💼</span>
                           <h3 className="text-xl font-black text-indigo-400">Career & Performance Insight</h3>
                        </div>
                        <div className="space-y-8">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Strategic Presentation</p>
                              <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 text-sm font-bold text-slate-300 leading-relaxed">
                                {activeModule.lesson.interviewTips.howToAnswer}
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Interview Readiness</p>
                              <div className="space-y-3">
                                 {activeModule.lesson.interviewTips.expectedQuestions.map((q, j) => (
                                    <div key={j} className="p-4 bg-slate-900 rounded-2xl border border-white/5 font-bold text-xs text-slate-400 flex items-start">
                                       <span className="mr-3 text-indigo-500">•</span> "{q}"
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     <button onClick={proceedFromAnalysis} className="w-full py-6 bg-white text-slate-900 font-black text-xl rounded-[2rem] shadow-2xl hover:scale-[1.03] transition-all active:scale-95 shadow-white/5">
                      {quizResults.score >= 3 ? 'Commit & Continue' : 'Retry Node Content'}
                     </button>
                  </div>
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const QuizComponent: React.FC<{ questions: QuizQuestion[], onComplete: (score: number, answers: any[]) => void, onBack: () => void }> = ({ questions, onComplete, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const q = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (isCorrect !== null) return;
    setSelectedIdx(idx);
  };

  const checkAnswer = () => {
    if (selectedIdx === null) return;
    const correct = selectedIdx === q.correctIndex;
    setIsCorrect(correct);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);

    const currentAnswer = {
      question: q.question,
      correct: correct,
      userIdx: selectedIdx,
      correctIdx: q.correctIndex,
      explanation: q.explanation
    };

    setAnswers([...answers, currentAnswer]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedIdx(null);
      setIsCorrect(null);
    } else {
      onComplete(score, answers); 
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full glass-card rounded-[3rem] p-12 md:p-16 space-y-10 shadow-[0_0_100px_-20px_rgba(79,70,229,0.2)] relative border border-white/10 flex flex-col my-10 animate-in zoom-in-95 duration-500">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-black text-lg text-indigo-400 uppercase tracking-[0.3em]">Knowledge Check</p>
            <p className="text-xs font-bold text-slate-500">Node Challenge {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className="w-40 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
             <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </header>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{q.question}</h2>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`group w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
                selectedIdx === idx 
                  ? isCorrect === null 
                    ? 'border-indigo-500 bg-indigo-600/20 shadow-xl' 
                    : isCorrect 
                      ? 'border-emerald-500 bg-emerald-600/20' 
                      : 'border-rose-500 bg-rose-600/20'
                  : isCorrect !== null && idx === q.correctIndex
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={`text-base font-bold ${selectedIdx === idx ? 'text-white' : 'text-slate-400'}`}>{opt}</span>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedIdx === idx ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10'
                }`}>
                  {selectedIdx === idx && (isCorrect === null ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : isCorrect ? '✓' : '✕')}
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="pt-10 border-t border-white/10 flex justify-end items-center space-x-6">
           {isCorrect === null ? (
             <button onClick={checkAnswer} disabled={selectedIdx === null} className="px-12 py-4 bg-indigo-600 text-white font-black text-base rounded-2xl shadow-xl hover:bg-indigo-500 disabled:opacity-20 transition-all active:scale-95 uppercase tracking-widest">
               Verify Answer
             </button>
           ) : (
             <div className="flex items-center space-x-6 animate-in slide-in-from-right-4">
               {isCorrect === false && <p className="text-rose-400 font-bold text-sm italic">Let's learn from this!</p>}
               <button onClick={nextQuestion} className="px-12 py-4 bg-white text-slate-900 font-black text-base rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95 uppercase tracking-widest">
                 {currentIdx + 1 < questions.length ? 'Next Question' : 'Finish Challenge'}
               </button>
             </div>
           )}
        </footer>
      </div>
      <button onClick={onBack} className="mt-10 text-slate-500 font-bold text-xs uppercase tracking-[0.4em] hover:text-rose-400 transition-colors">
        End Challenge
      </button>
    </div>
  );
};