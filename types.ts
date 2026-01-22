
export enum Persona {
  STUDENT = 'Student',
  PROFESSIONAL = 'Professional',
  CURIOUS = 'Curious Learner'
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface UserProfile {
  name: string;
  persona: Persona;
  language: string;
  goal: string;
  xp: number;
  level: number;
}

export interface InterviewTips {
  howToAnswer: string;
  expectedQuestions: string[];
}

export interface LessonPart {
  objective: string;
  keyConcepts: string[];
  explanationELI5: string;
  detailedExplanation: string;
  realWorldExample: string;
  recap: string[];
  interviewTips: InterviewTips;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Module {
  id: string;
  title: string;
  status: 'locked' | 'current' | 'completed';
  lesson?: LessonPart;
  quiz?: QuizQuestion[];
  progress: number;
}

export interface Course {
  id: string;
  topic: string;
  visualKeyword?: string;
  modules: Module[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
