
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";

// Safe retrieval of API Key for browser environments
const getApiKey = () => {
  try {
    // Check if process exists to avoid "process is not defined" error in some browser environments
    const key = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
    if (!key) {
      console.warn("IndiaJobFinder: API_KEY is missing from environment variables. Please check your Vercel project settings.");
    }
    return key || '';
  } catch (e) {
    return '';
  }
};

export const searchJobs = async (age: number, jobType: string): Promise<{ jobs: Job[], sources: any[] }> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Perform an exhaustive deep-web search for ${jobType} jobs in India suitable for a ${age}-year-old candidate.
  
  PRIORITY TARGETS:
  1. Niche regional/state department notifications (e.g., Municipalities, local cooperatives, State PSCs).
  2. Less-known private startups, local industrial estates, and specialized technical roles.
  3. "Hidden" jobs on official departmental 'Careers' pages not on aggregators.
  
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
    return { jobs: [], sources: [] };
  }
};
