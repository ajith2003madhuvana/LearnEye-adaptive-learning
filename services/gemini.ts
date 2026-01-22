
import { GoogleGenAI, Type } from "@google/genai";
import { LessonPart, QuizQuestion, Persona } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCourseContent = async (topic: string, persona: Persona, language: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate an extensive, production-grade adaptive learning path for the topic "${topic}" in the language: ${language}.
    The learner's persona is: ${persona}.
    
    CONTENT STRUCTURE REQUIREMENTS:
    1. Provide a 'visualKeyword' for topic imagery.
    2. 4-5 progressive modules.
    3. Each module must contain:
       - id: unique string
       - title: clear module name
       - lesson: EXTENSIVE learning content:
         * objective: 🎯 Clear, simple goal.
         * keyConcepts: 📌 3-5 foundational concepts.
         * explanationELI5: 🧠 Simple analogy or story to introduce the concept.
         * detailedExplanation: 🔍 Comprehensive, step-by-step documentation. Use a storytelling approach where possible. Provide enough detail that a complete beginner feels guided through every micro-step.
         * realWorldExample: 🧩 A practical, relatable scenario.
         * recap: ✅ 3 summary points.
         * interviewTips: 💼 Object containing:
           - howToAnswer: Guide on explaining this in a job interview.
           - expectedQuestions: 3 likely interview questions.
       - quiz: 5 SIMPLE, VERY EASY beginner-level multiple-choice questions with 'question', 'options', 'correctIndex', and 'explanation'.

    TONE: Friendly, supportive, and extremely clear.
    Always respond in ${language}.

    Format the response strictly as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualKeyword: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                lesson: {
                  type: Type.OBJECT,
                  properties: {
                    objective: { type: Type.STRING },
                    keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    explanationELI5: { type: Type.STRING },
                    detailedExplanation: { type: Type.STRING },
                    realWorldExample: { type: Type.STRING },
                    recap: { type: Type.ARRAY, items: { type: Type.STRING } },
                    interviewTips: {
                      type: Type.OBJECT,
                      properties: {
                        howToAnswer: { type: Type.STRING },
                        expectedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["howToAnswer", "expectedQuestions"]
                    }
                  },
                  required: ["objective", "keyConcepts", "explanationELI5", "detailedExplanation", "realWorldExample", "recap", "interviewTips"]
                },
                quiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.NUMBER },
                      explanation: { type: Type.STRING },
                    },
                    required: ["question", "options", "correctIndex", "explanation"]
                  }
                }
              },
              required: ["id", "title", "lesson", "quiz"]
            }
          }
        },
        required: ["modules", "visualKeyword"]
      }
    }
  });

  try {
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("Failed to parse course content", e);
    return null;
  }
};

export const getTutorResponse = async (
  message: string, 
  context: { topic: string, persona: Persona, language: string, history: { role: 'user' | 'model', text: string }[] }
) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are LearnEye, a world-class adaptive tutor.
      Topic: "${context.topic}". Language: ${context.language}. Persona: ${context.persona}.
      Be friendly, supportive, and guide the user with stories and simple explanations. Never give answers directly.`,
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
