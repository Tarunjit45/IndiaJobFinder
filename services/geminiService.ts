
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

const getApiKey = () => {
  return typeof process !== 'undefined' ? process.env?.API_KEY : '';
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[] }> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  onProgress?.("Initiating Global Deep Scan...");

  // Optimized single-pass prompt. Even with googleSearch, we can ask for a specific 
  // text structure that is extremely easy to parse (like a pseudo-JSON block).
  const prompt = `SEARCH REQUEST: Find 8 active ${jobType} job openings in India for a ${age}-year-old candidate.
  
  TARGETS: 
  - Recent State/Central Govt notifications.
  - New private sector openings from LinkedIn/Startups.
  
  OUTPUT FORMAT:
  You must provide a strictly formatted list. Start with the token [DATA_START] and end with [DATA_END].
  Inside, provide a JSON-like array of objects with these keys: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, sourceUrl, isUpcoming.
  
  Only include results that match the age: ${age}.`;

  try {
    onProgress?.("Accessing Google Search Index...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Using a small thinking budget to speed up reasoning while maintaining quality
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    onProgress?.("Extracting Data Points...");
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    let jobs: Job[] = [];
    
    // Efficient extraction using string markers
    const dataMatch = text.match(/\[DATA_START\]([\s\S]*?)\[DATA_END\]/);
    const jsonToParse = dataMatch ? dataMatch[1] : text;

    try {
      // Find the first '[' and last ']' to isolate the array
      const startIdx = jsonToParse.indexOf('[');
      const endIdx = jsonToParse.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const cleanedJson = jsonToParse.substring(startIdx, endIdx + 1);
        const rawJobs = JSON.parse(cleanedJson);
        
        // Map to our internal type
        jobs = rawJobs.map((j: any) => ({
          id: j.id || Math.random().toString(36).substr(2, 9),
          title: j.title || "Job Opening",
          organization: j.organization || "Unknown Org",
          type: j.type || "Private",
          location: j.location || "India",
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
          eligibility: j.eligibility || "Check source for details",
          lastDate: j.lastDate || "N/A",
          sourceUrl: j.sourceUrl || "",
          isUpcoming: !!j.isUpcoming,
          description: j.description || ""
        }));
      }
    } catch (e) {
      console.warn("Fast parse failed, trying secondary extraction...");
      // If the primary parse failed, we'll do one quick cleanup pass
      const cleanup = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Convert this text into a clean JSON array of jobs: ${text.substring(0, 2000)}`,
        config: { responseMimeType: "application/json" }
      });
      jobs = JSON.parse(cleanup.text);
    }

    onProgress?.("Scan Complete.");
    return { jobs, sources };
  } catch (error: any) {
    if (error?.message?.includes('Requested entity was not found')) {
      throw new Error("API_KEY_INVALID");
    }
    console.error("Search Error:", error);
    return { jobs: [], sources: [] };
  }
};
