
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchJobs = async (age: number, jobType: string): Promise<{ jobs: Job[], sources: any[] }> => {
  // Deep search prompt targeting niche and non-popular jobs
  const prompt = `DEEP WEB SEARCH: Find EVERY possible ${jobType} job in India suitable for age ${age}. 
  DO NOT LIMIT to popular sites. Search for:
  1. Niche regional/state department notifications (e.g., specific Municipalities, local cooperatives, State PSCs).
  2. Less-known private startups, local industrial estates, and specialized technical roles.
  3. "Hidden" jobs that aren't on major aggregators but are on official departmental/company 'Careers' pages.
  4. Both ongoing (active now) and upcoming (recently announced/leaked notifications).
  
  MANDATORY: Return a massive, comprehensive list. Include as many as possible. 
  
  RULES:
  - If it's a future start date, isUpcoming: true.
  - Identify if the source is 'Niche/Regional' in the description or title.
  - JSON array ONLY. No text around it.
  
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
    console.error("Deep Search Failed:", error);
    return { jobs: [], sources: [] };
  }
};
