import { GoogleGenAI, Type } from "@google/genai";
import { Persona } from "../types";

export const generateCourseContent = async (topic: string, persona: Persona, language: string) => {
  // Creating instance directly before call to ensure proper API key injection as per system instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a world-class curriculum designer. Generate a production-grade adaptive learning path for the topic "${topic}" in the language: ${language}.
    Target Persona: ${persona}.
    
    CONTENT STRUCTURE REQUIREMENTS (Strict):
    - 4-5 progressive modules from beginner to advanced.
    - Each module MUST be returned in the user's preferred language (${language}).
    - Each module must follow this structured lesson format:
      * objective: 🎯 One line specific learning objective.
      * keyConcepts: 📌 3-5 bulleted core concepts.
      * explanationELI5: 🧠 Simple introduction using a creative analogy.
      * detailedExplanation: 🔍 Point-by-point, easy to scan, progressive (simple to complex) detailed breakdown.
      * realWorldExample: 🧩 Practical example application in a modern context.
      * recap: ✅ Quick 3-bullet recap of what was learned.
      * interviewTips: 💼 Specific job interview insights related to this module.
    
    - quiz: 5 high-quality multiple-choice questions per module to validate mastery.

    TONE: Adaptive to persona (${persona}). Supportive, professional, and motivational.
    RESPONSE: STRICT JSON ONLY.`,
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
  // Creating instance directly before call to ensure proper API key injection as per system instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: context.history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: `You are LearnEye Buddy, a professional, supportive, and motivational AI tutor.
      Current Context:
      - Primary Topic: "${context.topic}"
      - User Persona: ${context.persona}
      - Preferred Language: ${context.language}
      
      BEHAVIOR RULES:
      1. Always respond in ${context.language}.
      2. Tone must adapt to the persona:
         - Student: Encouraging, simplified, uses analogies.
         - Professional: Efficient, practical, career-focused.
         - Curious: Exploratory, philosophical, deep-diving.
      3. NON-SPOILING: Never give direct answers to quiz-like questions. Instead, guide the user with hints or leading questions.
      4. Support frustrated learners with empathy and fast learners with challenging insights.
      5. Keep technical terms accurate but explain them in the context of the user's level.`,
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};