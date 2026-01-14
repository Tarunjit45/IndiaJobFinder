
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

const getApiKey = () => {
  // Priority 1: User provided key (Saved in browser)
  const savedKey = localStorage.getItem('IJF_API_KEY');
  if (savedKey) return savedKey;

  // Priority 2: Injected environment variable (Vercel)
  // Note: Vercel requires NEXT_PUBLIC_ prefix for client-side access
  return (process.env as any)?.NEXT_PUBLIC_API_KEY || (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[] }> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  onProgress?.("Connecting to India Job Network...");

  const prompt = `Find 8 active ${jobType} job openings in India for a ${age}-year-old. 
  Focus on the most recent notifications. 
  Strictly format the result as a JSON array between [DATA_START] and [DATA_END]. 
  Keys: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, sourceUrl, isUpcoming.`;

  try {
    onProgress?.("Scanning Government & Private Portals...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Keeping it fast and free
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    onProgress?.("Formatting results...");
    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    let jobs: Job[] = [];
    const dataMatch = text.match(/\[DATA_START\]([\s\S]*?)\[DATA_END\]/);
    const jsonStr = dataMatch ? dataMatch[1] : text;

    try {
      const start = jsonStr.indexOf('[');
      const end = jsonStr.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const cleaned = jsonStr.substring(start, end + 1);
        jobs = JSON.parse(cleaned).map((j: any) => ({
          ...j,
          id: j.id || Math.random().toString(36).substr(2, 9),
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
          type: j.type || (jobType === 'All' ? 'Private' : jobType)
        }));
      }
    } catch (e) {
      console.warn("Parsing failed, raw response used.");
    }

    return { jobs, sources };
  } catch (error: any) {
    // If the key is specifically invalid, clear it
    if (error?.message?.includes('API key not valid')) {
      localStorage.removeItem('IJF_API_KEY');
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
