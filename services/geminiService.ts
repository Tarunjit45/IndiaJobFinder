
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

// High-quality fallback data for Indian Job Seekers when API is busy
const STATIC_FALLBACK_JOBS: Job[] = [
  {
    id: 'fb-1',
    title: 'SSC Combined Graduate Level (CGL) 2024',
    organization: 'Staff Selection Commission',
    type: 'Government',
    location: 'All India',
    ageLimit: { min: 18, max: 32 },
    eligibility: 'Bachelor\'s Degree in any discipline',
    lastDate: 'Check official portal',
    description: 'Recruitment for Group B and C posts in various Ministries/Departments.',
    sourceUrl: 'https://ssc.gov.in',
    isUpcoming: false
  },
  {
    id: 'fb-2',
    title: 'IBPS PO/MT Phase XIV',
    organization: 'Institute of Banking Personnel Selection',
    type: 'Government',
    location: 'Public Sector Banks',
    ageLimit: { min: 20, max: 30 },
    eligibility: 'Graduate Degree from recognized University',
    lastDate: 'Ongoing Cycles',
    description: 'Probationary Officer recruitment for participating banks.',
    sourceUrl: 'https://www.ibps.in',
    isUpcoming: false
  },
  {
    id: 'fb-3',
    title: 'UPSC Civil Services Examination',
    organization: 'Union Public Service Commission',
    type: 'Government',
    location: 'All India',
    ageLimit: { min: 21, max: 32 },
    eligibility: 'Degree from any recognized University',
    lastDate: 'Annual Cycle',
    description: 'Recruitment for IAS, IPS, IFS and other central services.',
    sourceUrl: 'https://www.upsc.gov.in',
    isUpcoming: false
  },
  {
    id: 'fb-4',
    title: 'TCS Ninja/Digital Hiring',
    organization: 'Tata Consultancy Services',
    type: 'Private',
    location: 'Major Cities',
    ageLimit: { min: 18, max: 28 },
    eligibility: 'B.E/B.Tech/M.E/M.Tech/MCA/M.Sc',
    lastDate: 'Rolling Basis',
    description: 'Freshers hiring for software development roles.',
    sourceUrl: 'https://www.tcs.com/careers',
    isUpcoming: false
  },
  {
    id: 'fb-5',
    title: 'Railway Recruitment Board (RRB) NTPC',
    organization: 'Indian Railways',
    type: 'Government',
    location: 'Zonal Railways',
    ageLimit: { min: 18, max: 33 },
    eligibility: '12th Pass or Degree depending on post',
    lastDate: 'Periodic',
    description: 'Non-Technical Popular Categories recruitment.',
    sourceUrl: 'https://indianrailways.gov.in',
    isUpcoming: true
  }
];

const getApiKey = () => {
  const savedKey = localStorage.getItem('IJF_API_KEY');
  if (savedKey) return savedKey;
  return (process.env as any)?.NEXT_PUBLIC_API_KEY || (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[], isFallback: boolean }> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    onProgress?.("Loading preview mode...");
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [],
      isFallback: true 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  onProgress?.("Lightning Scan in progress...");

  const prompt = `FAST SEARCH: 6 active ${jobType} jobs in India for age ${age}. 
  Return ONLY JSON array between [START] and [END]. 
  Keys: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, sourceUrl, isUpcoming.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for faster/more consistent JSON
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let jobs: Job[] = [];
    
    const dataMatch = text.match(/\[START\]([\s\S]*?)\[END\]/);
    const jsonStr = dataMatch ? dataMatch[1] : text;

    try {
      const start = jsonStr.indexOf('[');
      const end = jsonStr.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        jobs = JSON.parse(jsonStr.substring(start, end + 1)).map((j: any) => ({
          ...j,
          id: j.id || Math.random().toString(36).substr(2, 9),
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
          type: j.type || (jobType === 'All' ? 'Private' : jobType)
        }));
      }
    } catch (e) {
      throw new Error("Parse Error");
    }

    return { jobs, sources, isFallback: false };
  } catch (error: any) {
    console.error("API Error or Timeout:", error);
    onProgress?.("API busy. Loading trending opportunities...");
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [],
      isFallback: true 
    };
  }
};
