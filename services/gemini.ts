import { GoogleGenAI, Type } from "@google/genai";
import { Persona } from "../types";

// Standard way to access API_KEY in this environment
const getApiKey = () => process.env.API_KEY || '';

export const generateCourseContent = async (topic: string, persona: Persona, language: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a production-grade adaptive learning path for the topic "${topic}" in the language: ${language}.
    Target Persona: ${persona}.
    
    CONTENT STRUCTURE REQUIREMENTS (Strict):
    - 4-5 progressive modules.
    - Each module must follow this structured lesson format:
      * objective: 🎯 One line objective.
      * keyConcepts: 📌 3-5 bulleted core concepts.
      * explanationELI5: 🧠 Simple introduction using an analogy.
      * detailedExplanation: 🔍 Point-by-point, easy to scan, progressive (simple to complex) detailed breakdown.
      * realWorldExample: 🧩 Practical example application.
      * recap: ✅ Quick 3-bullet recap.
      * interviewTips: 💼 Job interview insights.
    
    - quiz: 5 multiple-choice questions per module.

    TONE: Adaptive to persona (${persona}). Supportive and motivational.
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
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: context.history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: `You are LearnEye Buddy, a supportive and motivational AI tutor.
      Topic: "${context.topic}". Persona: ${context.persona}. Language: ${context.language}.
      Tone: Supportive, context-aware, non-spoiling (don't give answers, guide instead).`,
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};