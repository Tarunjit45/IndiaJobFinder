
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";

/**
 * In a browser-only environment (no build step like Vite/Webpack),
 * process.env is not available. This function safely attempts to get the key
 * without crashing the application.
 */
const getApiKey = () => {
  try {
    // 1. Check if defined in window (some injectors use this)
    if ((window as any).API_KEY) return (window as any).API_KEY;
    
    // 2. Check process.env safely
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }

    // 3. Look for a global config object
    if ((window as any)._env_ && (window as any)._env_.API_KEY) {
      return (window as any)._env_.API_KEY;
    }

    console.warn("IndiaJobFinder: API_KEY not found in environment. Ensure it is set in Vercel.");
    return '';
  } catch (e) {
    return '';
  }
};

export const searchJobs = async (age: number, jobType: string): Promise<{ jobs: Job[], sources: any[] }> => {
  const apiKey = getApiKey();
  
  // Initialize AI inside the function to ensure it uses the latest key state
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Perform an exhaustive deep-web search for ${jobType} jobs in India suitable for a ${age}-year-old candidate.
  
  PRIORITY TARGETS:
  1. Niche regional/state department notifications (e.g., Municipalities, local cooperatives, State PSCs).
  2. Less-known private startups and specialized technical roles.
  
  RULES:
  - Use Google Search tool.
  - Return ONLY a valid JSON array.
  
  SCHEMA: {title, organization, type, location, ageLimit:{min,max}, eligibility, startDate, lastDate, sourceUrl, isUpcoming}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              organization: { type: Type.STRING },
              type: { type: Type.STRING },
              location: { type: Type.STRING },
              ageLimit: {
                type: Type.OBJECT,
                properties: {
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER }
                },
                required: ["min", "max"]
              },
              eligibility: { type: Type.STRING },
              startDate: { type: Type.STRING },
              lastDate: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              isUpcoming: { type: Type.BOOLEAN }
            },
            required: ["title", "organization", "type", "lastDate", "isUpcoming"]
          }
        }
      },
    });

    const cleanedText = response.text || '[]';
    const jobs = JSON.parse(cleanedText.replace(/```json|```/g, "").trim() || '[]');
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { jobs, sources };
  } catch (error) {
    console.error("Deep Scan Search Error:", error);
    // If the error is an API key issue, alert the user or log clearly
    if (error instanceof Error && error.message.includes('API_KEY')) {
      console.error("CRITICAL: API Key is invalid or missing in Vercel environment variables.");
    }
    return { jobs: [], sources: [] };
  }
};
