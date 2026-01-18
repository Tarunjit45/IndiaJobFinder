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
  // Checks LocalStorage first (for Admin/Manual entry) then Environment
  return localStorage.getItem('IJF_API_KEY') || (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[], isFallback: boolean }> => {
  const apiKey = getApiKey();
  const now = new Date();
  const TODAY_STR = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    let globalJobs: any[] = [];

    // 1. CHECK CLOUD DATABASE FIRST (Shared Job Pool)
    // This allows regular users to see jobs without using an API key or hitting rate limits
    if (supabase) {
      onProgress?.("Checking Shared Job Pool...");
      
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
        .limit(30);

      if (!error && data) {
        globalJobs = data;
      }

      // If we have plenty of matches in the cloud, serve them immediately to save your API quota
      if (globalJobs.length >= 10) {
        onProgress?.(`Retrieved ${globalJobs.length} matches from Cloud!`);
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

    // 2. AI SCAN (ADMIN/KEY HOLDERS ONLY)
    // If we reach here, the database is "thin" for this specific age/type.
    // If the user doesn't have a key, we just give them whatever is in the DB + Fallbacks.
    if (!apiKey) {
       if (globalJobs.length > 0) {
          onProgress?.("Serving existing shared results...");
          return { 
            jobs: globalJobs.map(j => ({...j, id: j.id.toString(), ageLimit: { min: j.ageMin, max: j.ageMax }})), 
            sources: [], 
            isFallback: false 
          };
       }
       throw new Error("Shared pool is empty and no Admin API key found.");
    }

    // Admin-only logic starts here
    const ai = new GoogleGenAI({ apiKey });
    onProgress?.("Cloud database thin. Admin Scanning Web for New Jobs...");

    const prompt = `Find 10 ACTIVE Indian job notifications for age ${age}, category ${jobType}. 
    Current Date: ${TODAY_STR}. Deadline must be after today.
    Return ONLY a JSON array between [START] and [END].
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
      console.error("AI Response parsing failed");
    }

    // 3. UPSERT TO CLOUD (Share Admin's findings with all users)
    if (supabase && newJobs.length > 0) {
      onProgress?.("Updating Shared Cloud Pool...");
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

      // This uses the 'title, organization' unique constraint in your Supabase table
      await supabase.from('shared_jobs').upsert(formattedForDb, { onConflict: 'title,organization' });
    }

    // 4. FINAL MERGE
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
    console.error("Service Error:", error);
    onProgress?.("Notice: Serving Verified Offline Jobs.");
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [], 
      isFallback: true 
    };
  }
};
