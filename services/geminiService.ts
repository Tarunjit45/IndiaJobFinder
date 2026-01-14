
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

const getApiKey = () => {
  // 1. Check localStorage for user-provided key
  const savedKey = localStorage.getItem('IJF_API_KEY');
  if (savedKey) return savedKey;

  // 2. Check various environment variable patterns
  const envKey = 
    (process.env as any)?.API_KEY || 
    (process.env as any)?.VITE_API_KEY || 
    (process.env as any)?.NEXT_PUBLIC_API_KEY ||
    (window as any).process?.env?.API_KEY || 
    "";
    
  return envKey;
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[] }> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  onProgress?.("Initiating Deep Scan...");

  const prompt = `Find 8 active ${jobType} job openings in India for a ${age}-year-old. 
  Focus on the most recent 2024/2025 notifications. 
  Strictly format the result as a JSON array between [DATA_START] and [DATA_END]. 
  Keys: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, sourceUrl, isUpcoming.`;

  try {
    onProgress?.("Searching Indian Portals...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    onProgress?.("Decoding results...");
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
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 40 },
          type: j.type || (jobType === 'All' ? 'Private' : jobType)
        }));
      }
    } catch (e) {
      console.warn("Parse failed.");
    }

    return { jobs, sources };
  } catch (error: any) {
    if (error?.message?.includes('API key not valid')) {
      localStorage.removeItem('IJF_API_KEY');
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
