import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";
import { supabase } from "../lib/supabase";

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
    description: 'Ongoing central government recruitments.',
    sourceUrl: 'https://ssc.gov.in',
    isUpcoming: true
  }
];

const getApiKey = () => {
  return localStorage.getItem('IJF_API_KEY') || (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[], isFallback: boolean }> => {
  const apiKey = getApiKey();
  const now = new Date();
  const TODAY_STR = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    let globalJobs: any[] = [];

    // 1. CHECK CLOUD DATABASE FIRST (If initialized)
    if (supabase) {
      onProgress?.("Searching Shared Job Pool...");
      
      let query = supabase
        .from('shared_jobs')
        .select('*')
        .lte('ageMin', age)
        .gte('ageMax', age);

      if (jobType !== 'All') {
        query = query.eq('type', jobType);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        globalJobs = data;
      }

      // If we have significant fresh jobs (e.g., 8+), return them and skip AI
      if (globalJobs.length >= 8) {
        onProgress?.(`Found ${globalJobs.length} matches in Cloud!`);
        return { 
          jobs: globalJobs.map(j => ({
            ...j, 
            id: j.id.toString(),
            ageLimit: { min: j.ageMin, max: j.ageMax }
          })), 
          sources: [], 
          isFallback: false 
        };
      }
    }

    // 2. CALL AI ONLY IF DATABASE IS THIN
    if (!apiKey) {
       // If no API key and we have some DB results, show them
       if (globalJobs.length > 0) {
          return { 
            jobs: globalJobs.map(j => ({...j, id: j.id.toString(), ageLimit: { min: j.ageMin, max: j.ageMax }})), 
            sources: [], 
            isFallback: false 
          };
       }
       throw new Error("No API Key Provided");
    }

    const ai = new GoogleGenAI({ apiKey });
    onProgress?.("Scanning Web for Live Notifications...");

    const prompt = `Find 10 ACTIVE Indian job notifications for age ${age}, category ${jobType}. 
    Current Date: ${TODAY_STR}. Return ONLY a JSON array between [START] and [END].
    JSON fields: title, organization, type, location, ageMin, ageMax, eligibility, lastDate, description, sourceUrl`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1 
      }
    });

    const text = response.text || "";
    const dataMatch = text.match(/\[START\]([\s\S]*?)\[END\]/);
    const jsonStr = dataMatch ? dataMatch[1] : text;

    let newJobs: any[] = [];
    try {
      const start = jsonStr.indexOf('[');
      const end = jsonStr.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        newJobs = JSON.parse(jsonStr.substring(start, end + 1));
      }
    } catch (e) {
      console.error("AI Parse error");
    }

    // 3. UPSERT NEW JOBS TO CLOUD (If initialized)
    if (supabase && newJobs.length > 0) {
      const formattedForDb = newJobs.map(j => ({
        title: j.title,
        organization: j.organization,
        type: j.type || (jobType === 'All' ? 'Government' : jobType),
        location: j.location || 'India',
        ageMin: j.ageMin || 18,
        ageMax: j.ageMax || 45,
        eligibility: j.eligibility,
        lastDate: j.lastDate,
        description: j.description,
        sourceUrl: j.sourceUrl
      }));

      await supabase.from('shared_jobs').upsert(formattedForDb, { onConflict: 'title,organization' });
    }

    // 4. FINAL MERGE & DISPLAY
    const combined = [...newJobs, ...globalJobs];
    const uniqueJobs = combined
      .filter((v, i, a) => a.findIndex(t => t.title === v.title && t.organization === v.organization) === i)
      .map(j => ({
        ...j,
        id: j.id?.toString() || `job-${Math.random().toString(36).substr(2, 9)}`,
        ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
        type: j.type || (jobType === 'All' ? 'Government' : jobType)
      }));

    return { jobs: uniqueJobs, sources: [], isFallback: false };

  } catch (error) {
    console.error("Search error:", error);
    onProgress?.("Limit reached. Showing verified offline jobs.");
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [], 
      isFallback: true 
    };
  }
};