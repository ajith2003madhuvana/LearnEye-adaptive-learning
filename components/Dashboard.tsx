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

export const Dashboard: React.FC<DashboardProps> = ({ user, setUser, initialCourse, onCourseUpdate }) => {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [view, setView] = useState<'roadmap' | 'lesson' | 'quiz' | 'analysis'>('roadmap');
  const [loading, setLoading] = useState(!initialCourse);
  const [quizResults, setQuizResults] = useState<{ score: number, answers: { question: string, correct: boolean, userIdx: number, correctIdx: number, explanation: string }[] } | null>(null);
  
  const [sessionPoints, setSessionPoints] = useState<{name: string, xp: number}[]>([]);

  useEffect(() => {
    setSessionPoints([{ name: 'Init', xp: user.xp }]);
  }, []);

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
      
      const completedCount = newModules.filter(m => m.status === 'completed').length;
      setSessionPoints(prev => [...prev, { name: `Node ${completedCount}`, xp: newXP }]);
      
      setView('roadmap');
    } else {
      alert("Score was less than 3/5. Let's revisit the module and try again!");
      setView('lesson');
    }
    setQuizResults(null);
  };

  const handleLogout = () => {
    // Explicitly resetting user to null to trigger Onboarding view in App.tsx
    setUser(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0f172a] z-[1000]">
        <div className="animate-float mb-8"><Logo size="lg" /></div>
        <h2 className="text-2xl font-black text-white tracking-tighter animate-pulse mb-4">Designing Your Path...</h2>
        <p className="text-cyan-400 text-xl font-bold italic max-w-lg">"Ready for a wonderful journey learning {user.goal}, {user.name}?"</p>
      </div>
    );
  }

  const activeModule = course?.modules[activeModuleIndex];
  const completedModules = course?.modules.filter(m => m.status === 'completed').length || 0;
  
  const headerBgStyle = course?.visualKeyword ? {
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.8)), url('https://source.unsplash.com/1600x900/?${encodeURIComponent(course.visualKeyword)}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0f172a] text-slate-200">
      <AITutorSidebar user={user} course={course} />

      <nav className="fixed top-0 left-0 right-0 z-[100] glass-panel px-6 md:px-12 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setView('roadmap')}>
          <Logo size="sm" />
          <span className="font-black text-3xl text-white tracking-tighter group-hover:text-cyan-400 transition-colors">LearnEye</span>
        </div>
        <div className="flex items-center space-x-6">
           <div className="hidden sm:flex bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">LEVEL</span>
              <span className="text-sm font-black text-white">{user.level}</span>
           </div>
           <div className="flex items-center space-x-2 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-lg font-black text-xs">
              <Icons.Sparkles className="w-4 h-4 text-cyan-600" />
              <span>{user.xp} XP</span>
           </div>
           <button onClick={handleLogout} className="p-3 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-xl transition-all group flex items-center space-x-2">
              <Icons.Rocket className="w-4 h-4 text-rose-400 group-hover:text-white rotate-180" />
              <span className="text-[10px] font-black text-rose-400 group-hover:text-white uppercase tracking-widest hidden md:block">Logout</span>
           </button>
        </div>
      </nav>

      <div className="flex-1 w-full pt-[68px] flex flex-col">
        
        {view === 'roadmap' && course && (
          <div className="w-full flex flex-col animate-in fade-in duration-700">
            <header className="w-full h-[40vh] relative flex flex-col items-center justify-center text-center px-10 border-b border-white/5" style={headerBgStyle}>
              <div className="max-w-4xl space-y-4">
                <div className="inline-flex items-center px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20 backdrop-blur-xl">
                   <span className="text-[10px] font-black uppercase tracking-widest">Mastery Learning Path</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg">{course.topic}</h1>
                <p className="text-base md:text-lg text-slate-300 font-medium opacity-90 max-w-2xl mx-auto">
                   Hello {user.name}, you have mastered {completedModules} nodes. Continue your path below.
                </p>
              </div>
            </header>

            <div className="w-full bg-slate-950/50 flex-1 px-6 py-12">
              <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {course.modules.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => { if(m.status !== 'locked') { setActiveModuleIndex(idx); setView('lesson'); } }}
                    disabled={m.status === 'locked'}
                    className={`group relative flex flex-col items-center justify-between p-8 rounded-[2rem] border-2 h-auto min-h-[280px] transition-all duration-500 ${
                      m.status === 'current' 
                        ? 'border-cyan-500 bg-slate-900 shadow-[0_0_50px_-10px_rgba(34,211,238,0.2)] scale-105 z-10' 
                        : m.status === 'completed'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-white/5 bg-white/2 opacity-20 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className={`p-4 rounded-xl transition-all duration-500 group-hover:scale-110 ${
                      m.status === 'completed' ? 'bg-emerald-500 text-white' : m.status === 'current' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {m.status === 'completed' ? <Icons.Check className="w-7 h-7" /> : m.status === 'locked' ? <Icons.Lock className="w-7 h-7" /> : <Icons.Eye className="w-7 h-7 animate-pulse" />}
                    </div>
                    <div className="text-center space-y-1 py-4">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Module {idx + 1}</span>
                      <h3 className="font-black text-white text-lg tracking-tight leading-snug">{m.title}</h3>
                    </div>
                    <div className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${
                        m.status === 'current' ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-transparent text-slate-500 border-white/10'
                    }`}>
                      {m.status === 'completed' ? 'Review' : m.status === 'current' ? 'Start Node' : 'Locked'}
                    </div>
                  </button>
                ))}
              </div>
              
              <section className="max-w-screen-xl mx-auto mt-16 glass-card p-8 rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-3 gap-10 border border-white/5">
                 <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-black text-white flex items-center">
                       <span className="mr-3 p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Icons.Chart className="w-5 h-5" /></span>
                       Progress Analysis
                    </h3>
                    <div className="h-[220px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={performanceData}>
                           <defs>
                             <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.6}/>
                               <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.02)" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 9, fontWeight: 800}} />
                           <YAxis hide />
                           <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }} />
                           <Area type="monotone" dataKey="xp" stroke={COLORS.primary} strokeWidth={3} fill="url(#colorXp)" dot={{ r: 5, fill: COLORS.primary }} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="flex flex-col justify-center space-y-4">
                    <div className="p-6 bg-slate-900/60 rounded-[1.5rem] border border-white/5 text-center">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Academic Points</p>
                       <p className="text-3xl font-black text-white">{user.xp} <span className="text-[10px] text-cyan-400">XP</span></p>
                    </div>
                    <div className="p-6 bg-slate-900/60 rounded-[1.5rem] border border-white/5 text-center">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Nodes Mastered</p>
                       <p className="text-3xl font-black text-cyan-400">{completedModules}</p>
                    </div>
                 </div>
              </section>
            </div>
          </div>
        )}

        {view === 'lesson' && activeModule?.lesson && (
          <div className="w-full flex-1 bg-slate-950 flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-full h-[30vh] relative flex items-center justify-center overflow-hidden border-b border-white/5" style={headerBgStyle}>
               <button onClick={() => setView('roadmap')} className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                  ← Roadmap
               </button>
               <div className="relative z-10 text-center space-y-3 max-w-4xl px-6">
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-xl">
                    {activeModule.title}
                  </h2>
                  <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
                  <p className="text-xs md:text-sm text-cyan-400 font-bold uppercase tracking-widest opacity-90">
                    {activeModule.lesson.objective}
                  </p>
               </div>
            </div>

            <div className="w-full max-w-3xl px-6 py-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-white">Concept Visualizer</h3>
                    <div className="glass-card p-6 rounded-[1.5rem] bg-indigo-500/5 border-indigo-500/10">
                       <p className="text-base font-bold italic text-slate-200 leading-relaxed">
                         "{activeModule.lesson.explanationELI5}"
                       </p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Key Takeaways</h4>
                    <ul className="space-y-3">
                       {activeModule.lesson.keyConcepts.map((k, i) => (
                         <li key={i} className="flex items-start text-sm font-bold text-slate-300 leading-snug">
                           <span className="w-2 h-2 bg-cyan-500 rounded-full mt-1.5 mr-3 flex-shrink-0" /> {k}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              <div className="space-y-8">
                 <h4 className="text-xl font-black text-white text-center">Step-by-Step Explanation</h4>
                 <div className="text-base text-slate-400 leading-relaxed font-medium space-y-6">
                    {activeModule.lesson.detailedExplanation.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-10 md:p-14 rounded-[2.5rem] text-slate-900 shadow-xl relative overflow-hidden">
                 <Icons.Rocket className="absolute -top-10 -right-10 w-48 h-48 opacity-5" />
                 <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black flex items-center">
                       <span className="mr-3 text-2xl">🧩</span> Real World Scenario
                    </h4>
                    <p className="text-base font-bold leading-relaxed text-slate-800">
                      {activeModule.lesson.realWorldExample}
                    </p>
                 </div>
              </div>

              <div className="glass-card p-8 rounded-[2rem] bg-emerald-500/5 border-emerald-500/10">
                 <h4 className="text-sm font-black text-emerald-400 mb-6 text-center uppercase tracking-widest">Quick Recall</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {activeModule.lesson.recap.map((point, i) => (
                     <div key={i} className="p-4 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-2">
                        <Icons.Check className="w-6 h-6 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-300">{point}</span>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center py-12 border-t border-white/5 space-y-8">
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-white">Ready for Confirmation?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Pass the 5-question quiz to unlock the next node</p>
                 </div>
                 <button onClick={() => setView('quiz')} className="px-12 py-4 bg-cyan-500 text-white font-black text-lg rounded-[1.5rem] shadow-lg hover:bg-cyan-600 transition-all active:scale-95">
                   Take Knowledge Check →
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
          <div className="w-full flex-1 flex flex-col items-center bg-slate-950 py-12 px-6 animate-in fade-in duration-700">
             <div className="max-w-3xl w-full space-y-10">
               <header className="text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg ${quizResults.score >= 3 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                     {quizResults.score}/5
                  </div>
                  <h2 className="text-3xl font-black text-white">{quizResults.score >= 3 ? 'Node Mastered!' : 'Node Incomplete'}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Performance Analysis Report</p>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-lg font-black text-white">Quiz Log</h3>
                     <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {quizResults.answers.map((ans, i) => (
                           <div key={i} className={`p-5 rounded-[1.5rem] border-2 ${ans.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <p className="text-xs font-black text-white mb-2 leading-tight">Q{i+1}: {ans.question}</p>
                              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                Feedback: {ans.explanation}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="glass-card p-6 rounded-[2rem] space-y-4 bg-indigo-500/5 border-indigo-500/10">
                        <h3 className="text-lg font-black text-indigo-400 flex items-center">
                           <span className="mr-3">💼</span> Career Insight
                        </h3>
                        <div className="space-y-4">
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Presentation Strategy</p>
                              <p className="text-xs font-bold text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg">
                                {activeModule.lesson.interviewTips.howToAnswer}
                              </p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Module Interview Topics</p>
                              <div className="space-y-2">
                                 {activeModule.lesson.interviewTips.expectedQuestions.map((q, j) => (
                                    <div key={j} className="p-3 bg-slate-900 rounded-lg border border-white/5 font-bold text-[10px] text-slate-300">
                                       "{q}"
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     <button onClick={proceedFromAnalysis} className="w-full py-5 bg-white text-slate-900 font-black text-lg rounded-[1.5rem] shadow-lg hover:scale-[1.02] transition-all active:scale-95">
                      {quizResults.score >= 3 ? 'Sync Progress' : 'Return to Node'}
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

    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
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
    <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full glass-card rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-2xl relative border border-white/10 flex flex-col my-8">
        <header className="flex items-center justify-between">
          <p className="font-black text-base text-cyan-400 uppercase tracking-widest">Question {currentIdx + 1}<span className="text-slate-600 font-medium tracking-normal"> / {questions.length}</span></p>
          <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
             <div className="h-full shimmer-bg" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </header>

        <h2 className="text-xl md:text-2xl font-black text-white leading-snug tracking-tight">{q.question}</h2>

        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`group w-full p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                selectedIdx === idx 
                  ? isCorrect === null 
                    ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/10' 
                    : isCorrect 
                      ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/10' 
                      : 'border-rose-500 bg-rose-500/20 shadow-lg shadow-rose-500/10'
                  : isCorrect !== null && idx === q.correctIndex
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-white/5 bg-white/2 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${selectedIdx === idx ? 'text-white' : 'text-slate-400'}`}>{opt}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedIdx === idx ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/10'
                }`}>
                  {selectedIdx === idx && (isCorrect === null ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> : isCorrect ? '✓' : '✕')}
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="pt-6 border-t border-white/5 flex justify-end items-center space-x-4">
           {isCorrect === null ? (
             <button onClick={checkAnswer} disabled={selectedIdx === null} className="px-8 py-3 bg-white text-slate-900 font-black text-sm rounded-xl shadow-xl hover:scale-105 disabled:opacity-20 transition-all active:scale-95 uppercase tracking-widest">
               Verify
             </button>
           ) : (
             <button onClick={nextQuestion} className="px-8 py-3 bg-cyan-500 text-white font-black text-sm rounded-xl shadow-xl hover:bg-cyan-600 transition-all active:scale-95 uppercase tracking-widest">
               {currentIdx + 1 < questions.length ? 'Next Node' : 'Complete Challenge'}
             </button>
           )}
        </footer>
      </div>
      <button onClick={onBack} className="mt-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-rose-400 transition-colors">
        Cancel Challenge
      </button>
    </div>
  );
};
