import { GoogleGenAI, Type } from "@google/genai";
import { Persona } from "../types";

/**
 * IMPORTANT:
 * - import.meta.env is NOT visible to CDN-loaded SDKs
 * - So we read from window fallback
 */
const apiKey: string =
  import.meta.env.VITE_GEMINI_API_KEY ||
  (window as any).__GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Gemini API key is missing. Check VITE_GEMINI_API_KEY.");
}

export const generateCourseContent = async (
  topic: string,
  persona: Persona,
  language: string
) => {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a world-class educational architect. Create a professional, production-grade learning path for: "${topic}".
Target Learner Persona: ${persona}.
Language: ${language}.

CONTENT REQUIREMENTS (Strict):
- Return exactly 4-5 modules.
- All content (titles, explanations, quizzes) MUST be in ${language}.
- Use the following lesson structure for each module:
  * objective: 🎯 One clear learning objective.
  * keyConcepts: 📌 3-5 core concepts.
  * explanationELI5: 🧠 Simple analogy/ELI5.
  * detailedExplanation: 🔍 Comprehensive, point-wise, progressive breakdown.
  * realWorldExample: 🧩 Practical use case.
  * recap: 3 ✅ summary points.
  * interviewTips: 💼 Job interview preparation insights.

- quiz: 5 high-quality multiple-choice questions per module.

TONE: Adaptive to persona (${persona}). Supportive, professional, and motivational.
RESPONSE FORMAT: JSON ONLY.`,
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
                        expectedQuestions: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["howToAnswer", "expectedQuestions"]
                    }
                  },
                  required: [
                    "objective",
                    "keyConcepts",
                    "explanationELI5",
                    "detailedExplanation",
                    "realWorldExample",
                    "recap",
                    "interviewTips"
                  ]
                },
                quiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.NUMBER },
                      explanation: { type: Type.STRING }
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

  const text = response.text;
  return text ? JSON.parse(text) : null;
};

export const getTutorResponse = async (
  message: string,
  context: {
    topic: string;
    persona: Persona;
    language: string;
    history: { role: "user" | "model"; text: string }[];
  }
) => {
  const ai = new GoogleGenAI({ apiKey });

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: context.history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: `You are LearnEye Buddy, a professional, supportive, and motivational AI tutor.
Rules:
1. Always respond in ${context.language}.
2. Tone: Adapt to ${context.persona}.
3. Non-spoiling: Do not give direct answers to quiz questions. Guide the learner.
4. Context-aware: Refer to ${context.topic} when appropriate.`
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
