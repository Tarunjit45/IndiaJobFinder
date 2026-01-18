
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

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
  },
  {
    id: 'fb-gen-2',
    title: 'UPSC Examination Calendar',
    organization: 'Union Public Service Commission',
    type: 'Government',
    location: 'Pan India',
    ageLimit: { min: 21, max: 32 },
    eligibility: 'Any Graduate',
    lastDate: 'Check official portal',
    description: 'Civil Services, NDA, CDS, and Engineering Services notifications.',
    sourceUrl: 'https://www.upsc.gov.in',
    isUpcoming: false
  },
  {
    id: 'fb-gen-3',
    title: 'IBPS Banking Jobs 2025',
    organization: 'Institute of Banking Personnel Selection',
    type: 'Government',
    location: 'Multiple Banks',
    ageLimit: { min: 20, max: 30 },
    eligibility: 'Any Graduate',
    lastDate: 'Check Site',
    description: 'Recruitment for PO, Clerk, and Specialist Officers in public sector banks.',
    sourceUrl: 'https://ibps.in',
    isUpcoming: false
  },
  {
    id: 'fb-gen-4',
    title: 'Railway Recruitment (RRB) NTPC',
    organization: 'Railway Recruitment Board',
    type: 'Government',
    location: 'All India',
    ageLimit: { min: 18, max: 33 },
    eligibility: '12th / Graduate',
    lastDate: 'Various',
    description: 'Mass recruitment for non-technical popular categories in Indian Railways.',
    sourceUrl: 'https://indianrailways.gov.in',
    isUpcoming: true
  }
];

const getApiKey = () => {
  const savedKey = localStorage.getItem('IJF_API_KEY');
  if (savedKey) return savedKey;
  return (process.env as any)?.API_KEY || "";
};

export const searchJobs = async (age: number, jobType: string, onProgress?: (msg: string) => void): Promise<{ jobs: Job[], sources: any[], isFallback: boolean }> => {
  const apiKey = getApiKey();
  const now = new Date();
  const TODAY_STR = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  if (!apiKey) {
    onProgress?.(`Viewing Active Jobs as of ${TODAY_STR}...`);
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [],
      isFallback: true 
    };
  }

  // Use Gemini Flash Lite: The fastest model for free-tier users
  const ai = new GoogleGenAI({ apiKey: apiKey });
  onProgress?.(`Deep Scan for ${TODAY_STR}...`);

  // Maximize results by asking for 15 jobs instead of 6
  const prompt = `DATE: ${TODAY_STR}. Find up to 15 REAL and ACTIVE Indian job openings for age ${age}, category ${jobType}. 
  SEARCH PRIORITY: sarkariresult.com, freejobalert.com, official SSC/UPSC/IBPS/RRB sites, and top IT company career pages.
  DEADLINE MUST BE AFTER ${TODAY_STR}. 
  Return ONLY a JSON array between [START] and [END]. 
  Fields: id, title, organization, type, location, ageMin, ageMax, eligibility, lastDate, description, sourceUrl, isUpcoming`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest", 
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
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
          id: j.id || `live-${Math.random().toString(36).substr(2, 5)}`,
          ageLimit: { min: j.ageMin || 18, max: j.ageMax || 45 },
          type: j.type || (jobType === 'All' ? 'Government' : jobType)
        }));
      }
    } catch (e) {
      throw new Error("Parse Error");
    }

    // Sort to show urgent deadlines first
    const sortedJobs = jobs.sort((a, b) => a.lastDate.localeCompare(b.lastDate));

    return { jobs: sortedJobs, sources, isFallback: false };
  } catch (error: any) {
    console.error("Scan Error:", error);
    onProgress?.("Switching to Verified Database...");
    return { 
      jobs: STATIC_FALLBACK_JOBS.filter(j => (jobType === 'All' || j.type === jobType) && age >= j.ageLimit.min && age <= j.ageLimit.max), 
      sources: [],
      isFallback: true 
    };
  }
};
