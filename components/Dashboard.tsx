
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
  "Analyzing your unique goals...",
  "Architecting your modular roadmap...",
  "Synthesizing practical examples...",
  "Drafting adaptive challenges...",
  "Polishing your workspace..."
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
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStatusIdx(prev => (prev + 1) % LOADING_STATUSES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const performanceData = useMemo(() => {
    if (sessionPoints.length < 2) return [{ name: '', xp: Math.max(0, user.xp - 100) }, ...sessionPoints];
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
      if (activeModuleIndex + 1 < newModules.length) newModules[activeModuleIndex + 1].status = 'current';
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
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-950 z-[1000]">
        <div className="animate-float mb-12"><Logo size="lg" /></div>
        <div className="space-y-8 max-w-lg">
          <h2 className="text-4xl font-black text-white tracking-tighter">LearnEye is architecting...</h2>
          <p className="text-indigo-400 text-xl font-bold italic h-8 transition-all">
            "{LOADING_STATUSES[loadingStatusIdx]}"
          </p>
          <div className="flex justify-center space-x-2">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeModule = course?.modules[activeModuleIndex];
  const completedModulesCount = course?.modules.filter(m => m.status === 'completed').length || 0;
  
  const headerBgStyle = course?.visualKeyword ? {
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://source.unsplash.com/1600x900/?${encodeURIComponent(course.visualKeyword)}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-200">
      <AITutorSidebar user={user} course={course} />

      <nav className="fixed top-0 left-0 right-0 z-[100] glass-panel px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/5 shadow-xl">
        <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setView('roadmap')}>
          <Logo size="sm" />
          <span className="font-black text-2xl text-white tracking-tighter group-hover:text-indigo-400 transition-colors">LearnEye</span>
        </div>
        <div className="flex items-center space-x-6">
           <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">XP PROGRESS</span>
              <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(user.xp % 1000) / 10}%` }} />
              </div>
           </div>
           <div className="flex items-center space-x-3 bg-indigo-600 px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/20 text-white font-black text-sm">
              <Icons.Sparkles className="w-4 h-4" />
              <span>{user.xp} XP</span>
           </div>
           <button onClick={() => setUser(null)} className="p-3 bg-slate-900 border border-white/10 rounded-xl hover:bg-rose-600 transition-all text-slate-400 hover:text-white">
              <Icons.Rocket className="w-5 h-5 rotate-180" />
           </button>
        </div>
      </nav>

      <div className="flex-1 w-full pt-[92px] flex flex-col">
        
        {view === 'roadmap' && course && (
          <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="w-full h-[40vh] relative flex flex-col items-center justify-center text-center px-10 border-b border-white/5" style={headerBgStyle}>
              <div className="max-w-4xl space-y-4">
                <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Curated Roadmap</div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">{course.topic}</h1>
                <p className="text-lg text-slate-300 font-medium opacity-80 max-w-2xl mx-auto">
                   <b>{user.name}</b>, you have completed <b>{completedModulesCount}</b> of {course.modules.length} nodes on your mastery path.
                </p>
              </div>
            </header>

            <div className="w-full px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {course.modules.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => { if(m.status !== 'locked') { setActiveModuleIndex(idx); setView('lesson'); } }}
                    disabled={m.status === 'locked'}
                    className={`group relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left min-h-[300px] ${
                      m.status === 'current' ? 'border-indigo-500 bg-indigo-600/5 shadow-2xl scale-105 z-10' : 
                      m.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/2 opacity-30 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 ${
                      m.status === 'completed' ? 'bg-emerald-500 text-white' : m.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {m.status === 'completed' ? <Icons.Check className="w-8 h-8" /> : m.status === 'locked' ? <Icons.Lock className="w-8 h-8" /> : <Icons.Eye className="w-8 h-8 animate-pulse" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node {idx + 1}</span>
                      <h3 className="font-black text-white text-xl tracking-tight leading-tight group-hover:text-indigo-400">{m.title}</h3>
                    </div>
                    <div className={`mt-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border text-center transition-all ${
                        m.status === 'current' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-transparent text-slate-500 border-white/10 group-hover:border-indigo-500 group-hover:text-white'
                    }`}>
                      {m.status === 'completed' ? 'Review Content' : m.status === 'current' ? 'Start Module' : 'Locked Node'}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-white flex items-center">
                          <Icons.Chart className="w-6 h-6 mr-3 text-indigo-500" />
                          Growth Analysis
                       </h3>
                    </div>
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={performanceData}>
                           <defs>
                             <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                               <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                           <YAxis hide />
                           <Tooltip contentStyle={{ borderRadius: '16px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} />
                           <Area type="monotone" dataKey="xp" stroke={COLORS.primary} strokeWidth={3} fill="url(#colorXp)" dot={{ r: 4, fill: COLORS.primary }} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-900/30 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Completion Matrix</p>
                    <div className="relative mb-6">
                       <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center">
                          <span className="text-4xl font-black text-white">{Math.round((completedModulesCount / (course?.modules.length || 1)) * 100)}%</span>
                       </div>
                       <svg className="absolute top-0 left-0 w-32 h-32 -rotate-90">
                         <circle cx="64" cy="64" r="62" fill="transparent" stroke={COLORS.primary} strokeWidth="4" strokeDasharray={`${Math.round((completedModulesCount / (course?.modules.length || 1)) * 389.5)} 389.5`} strokeLinecap="round" />
                       </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-400 italic">"The eye sees what the mind learns."</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'lesson' && activeModule?.lesson && (
          <div className="w-full flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-full h-[30vh] relative flex items-center justify-center overflow-hidden border-b border-white/5" style={headerBgStyle}>
               <button onClick={() => setView('roadmap')} className="absolute top-6 left-6 z-20 px-5 py-2.5 bg-slate-900/60 hover:bg-indigo-600 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                  ← Back to Path
               </button>
               <div className="relative z-10 text-center space-y-3 px-10">
                  <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-xl">{activeModule.title}</h2>
                  <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
                  <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">
                    {activeModule.lesson.objective}
                  </p>
               </div>
            </div>

            <div className="w-full max-w-4xl px-8 py-16 space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h3 className="text-xl font-black text-white">The Analogy 🧠</h3>
                    <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/20 italic text-slate-200 text-lg leading-relaxed">
                       "{activeModule.lesson.explanationELI5}"
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Foundational Nodes 📌</h4>
                    <ul className="space-y-4">
                       {activeModule.lesson.keyConcepts.map((k, i) => (
                         <li key={i} className="flex items-start font-bold text-slate-300 leading-relaxed group">
                           <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform" /> {k}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              <div className="space-y-8">
                 <h4 className="text-2xl font-black text-white text-center">Detailed Synthesis 🔍</h4>
                 <div className="text-lg text-slate-400 leading-relaxed font-medium space-y-6 tutor-text">
                    {activeModule.lesson.detailedExplanation.split('\n').map((para, i) => (
                      <p key={i} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>{para}</p>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <span className="text-5xl">🧩</span>
                    <div className="space-y-2">
                       <h4 className="text-xl font-black text-white">Practical Matrix</h4>
                       <p className="text-slate-300 font-bold leading-relaxed">{activeModule.lesson.realWorldExample}</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-emerald-600/5 border border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {activeModule.lesson.recap.map((point, i) => (
                   <div key={i} className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg"><Icons.Check className="w-5 h-5 text-emerald-500" /></div>
                      <span className="text-sm font-bold text-slate-400">{point}</span>
                   </div>
                 ))}
              </div>

              <div className="flex flex-col items-center justify-center py-16 border-t border-white/10 space-y-8">
                 <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-white">Verification Mode</h3>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-[0.3em]">Pass the challenge to proceed to the next node</p>
                 </div>
                 <button onClick={() => setView('quiz')} className="px-14 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-all">
                   Begin Knowledge Check →
                 </button>
              </div>
            </div>
          </div>
        )}

        {view === 'quiz' && activeModule?.quiz && (
           <QuizComponent questions={activeModule.quiz} onComplete={completeModule} onBack={() => setView('lesson')} />
        )}

        {view === 'analysis' && quizResults && activeModule && (
          <div className="w-full flex-1 flex flex-col items-center bg-slate-950 py-16 px-8 animate-in zoom-in-95 duration-500">
             <div className="max-w-4xl w-full space-y-12">
               <header className="text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-black shadow-2xl ${quizResults.score >= 3 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                     {quizResults.score}/5
                  </div>
                  <h2 className="text-3xl font-black text-white">{quizResults.score >= 3 ? 'Success! Node Synchronized.' : 'Review Mandatory'}</h2>
               </header>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  <div className="space-y-6">
                     <h3 className="text-lg font-black text-white uppercase tracking-widest">Feedback Loop</h3>
                     <div className="space-y-4">
                        {quizResults.answers.map((ans, i) => (
                           <div key={i} className={`p-6 rounded-2xl border ${ans.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <p className="text-sm font-bold text-white mb-2 leading-tight">Q{i+1}: {ans.question}</p>
                              <p className="text-xs text-slate-500 italic border-t border-white/5 pt-2">{ans.explanation}</p>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6 sticky top-28">
                     <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/20 space-y-6">
                        <h3 className="text-lg font-black text-indigo-400">Career Insights 💼</h3>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed">{activeModule.lesson.interviewTips.howToAnswer}</p>
                        <div className="space-y-2">
                           {activeModule.lesson.interviewTips.expectedQuestions.map((q, j) => (
                              <div key={j} className="text-xs font-bold text-slate-500 flex items-center">
                                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2" /> "{q}"
                              </div>
                           ))}
                        </div>
                     </div>
                     <button onClick={proceedFromAnalysis} className="w-full py-5 bg-white text-slate-950 font-black text-lg rounded-2xl shadow-xl hover:bg-indigo-50 transition-all">
                      {quizResults.score >= 3 ? 'Proceed to Next Node' : 'Recalibrate & Retry'}
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
  const handleSelect = (idx: number) => { if (isCorrect === null) setSelectedIdx(idx); };

  const checkAnswer = () => {
    if (selectedIdx === null) return;
    const correct = selectedIdx === q.correctIndex;
    setIsCorrect(correct);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setAnswers([...answers, { question: q.question, correct, explanation: q.explanation }]);
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
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full glass-card rounded-[3rem] p-10 md:p-14 space-y-8 relative border border-white/10 animate-in zoom-in-95 duration-500">
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <p className="font-black text-xs text-indigo-400 uppercase tracking-[0.3em]">Knowledge Verification</p>
            <p className="text-[10px] font-bold text-slate-500">Step {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </header>
        <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleSelect(idx)} className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                selectedIdx === idx ? (isCorrect === null ? 'border-indigo-500 bg-indigo-600/10' : (isCorrect ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10')) :
                (isCorrect !== null && idx === q.correctIndex ? 'border-emerald-500/30' : 'border-white/5 bg-white/5 hover:border-white/10')
              }`}>
              <span className={`text-sm font-bold ${selectedIdx === idx ? 'text-white' : 'text-slate-400'}`}>{opt}</span>
            </button>
          ))}
        </div>
        <footer className="pt-6 border-t border-white/5 flex justify-end">
           {isCorrect === null ? (
             <button onClick={checkAnswer} disabled={selectedIdx === null} className="px-10 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-20 transition-all">Verify Logic</button>
           ) : (
             <button onClick={nextQuestion} className="px-10 py-3.5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl transition-all">{currentIdx + 1 < questions.length ? 'Next Step' : 'Finalize Verification'}</button>
           )}
        </footer>
      </div>
      <button onClick={onBack} className="mt-8 text-slate-600 font-bold text-[10px] uppercase tracking-[0.4em] hover:text-rose-400 transition-colors">Abort Logic Sync</button>
    </div>
  );
};
