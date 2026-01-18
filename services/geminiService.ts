import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

// Key for browser storage
const CACHE_KEY = 'IJF_GLOBAL_JOB_CACHE';

const STATIC_FALLBACK_JOBS: Job[] = [
  {
    id: 'fb-gen-1',
    title: 'SSC Recruitment Cycle 2025-26',
    organization: 'Staff Selection Commission',
    type: 'Government',
    location: 'All India',
    ageLimit: { min: 18, max: 32 },
    eligibility: 'Bachelor\'s Degree / 12th',
    lastDate: 'Varies by Post',
    description: 'Ongoing and upcoming central government recruitments for various departments.',
    sourceUrl: 'https://ssc.gov.in',
    isUpcoming: true
  }
  // ... (keep your other static jobs here)
];

// HELPER: Get jobs saved from previous AI searches
const getCachedJobs = (): Job[] => {
  const saved = localStorage.getItem(CACHE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// HELPER: Save new jobs to the cache without duplicates
const saveToCache = (newJobs: Job[]) => {
  const existing = getCachedJobs();
  // Merge and remove duplicates based on Title + Org
  const combined = [...newJobs, ...existing];
  const unique = combined.filter((job, index, self) =>
    index === self.findIndex((t) => t.title === job.title && t.organization === job.organization)
  );
  // Keep only the latest 100 jobs to avoid slowing down the browser
  localStorage.setItem(CACHE_KEY, JSON.stringify(unique.slice(0, 100)));
};

const getApiKey = () => {
  const savedKey = localStorage.getItem('IJF_API_KEY');
  return savedKey || (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[], isFallback: boolean }> => {
  const apiKey = getApiKey();
  const now = new Date();
  const TODAY_STR = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // 1. Get previously searched jobs from Cache
  const cachedHistory = getCachedJobs().filter(j => 
    (jobType === 'All' || j.type === jobType) && 
    age >= j.ageLimit.min && 
    age <= j.ageLimit.max
  );

  if (!apiKey) {
    onProgress?.(`Viewing Cache & Fallbacks...`);
    return { 
      jobs: [...cachedHistory, ...STATIC_FALLBACK_JOBS].slice(0, 15), 
      sources: [],
      isFallback: true 
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  onProgress?.(`Scanning for NEW jobs to add to your list...`);

  const prompt = `DATE: ${TODAY_STR}. Find 10 REAL and ACTIVE Indian job openings for age ${age}, category ${jobType}. 
  SEARCH PRIORITY: sarkariresult.com, freejobalert.com, official portals.
  DEADLINE MUST BE AFTER ${TODAY_STR}. 
  Return ONLY a JSON array between [START] and [END]. 
  Fields: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, description, sourceUrl, isUpcoming`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-lite", // Updated to standard 1.5 flash lite
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let newJobs: Job[] = [];
    
    const dataMatch = text.match(/\[START\]([\s\S]*?)\[END\]/);
    const jsonStr = dataMatch ? dataMatch[1] : text;

    try {
      const start = jsonStr.indexOf('[');
      const end = jsonStr.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        newJobs = JSON.parse(jsonStr.substring(start, end + 1)).map((j: any) => ({
          ...j,
          id: j.id || `live-${Math.random().toString(36).substr(2, 5)}`,
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
          type: j.type || (jobType === 'All' ? 'Government' : jobType)
        }));
      }
    } catch (e) {
      console.error("Parse failed, using cache only.");
    }

    // 2. SAVE the new AI results to the cache for future use
    if (newJobs.length > 0) {
      saveToCache(newJobs);
    }

    // 3. MERGE: Previous Cached Jobs + New AI Jobs
    const finalDisplayList = [...newJobs, ...cachedHistory];
    
    // Sort by deadline
    const sortedJobs = finalDisplayList.sort((a, b) => a.lastDate.localeCompare(b.lastDate));

    return { jobs: sortedJobs, sources, isFallback: false };

  } catch (error: any) {
    console.error("API Limit or Error:", error);
    onProgress?.("API Busy. Showing Cached & Verified Jobs...");
    return { 
      jobs: [...cachedHistory, ...STATIC_FALLBACK_JOBS].filter(j => 
        (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max
      ), 
      sources: [],
      isFallback: true 
    };
  }
};
