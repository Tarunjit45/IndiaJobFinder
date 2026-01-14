
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchJobs = async (age: number, jobType: string): Promise<{ jobs: Job[], sources: any[] }> => {
  // Deep search prompt targeting niche and non-popular jobs with strict JSON output
  const prompt = `DEEP WEB SEARCH: Find EVERY possible ${jobType} job in India suitable for age ${age}. 
  CRITICAL: Look for niche regional/state notifications, local startups, and departmental notifications (Sarkari, Private, Niche).
  DO NOT limit to top 10. Return as many as found.
  
  RULES:
  - isUpcoming: true if notification is recently released or starting soon.
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

    const jobs = JSON.parse(response.text || '[]');
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { jobs, sources };
  } catch (error) {
    console.error("Vercel Search Error:", error);
    return { jobs: [], sources: [] };
  }
};
