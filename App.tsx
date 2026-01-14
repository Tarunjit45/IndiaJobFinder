
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import JobCard from './components/JobCard';
import { searchJobs } from './services/geminiService';
import { Job, GroundingSource } from './types';

// Moved interface and declaration to ensure identical modifiers and types across the module
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [age, setAge] = useState<string>('21');
  const [jobType, setJobType] = useState<string>('All');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [needsKey, setNeedsKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      const envKey = typeof process !== 'undefined' ? process.env?.API_KEY : null;
      if (!envKey && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) setNeedsKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
    }
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setHasSearched(true);
    setProgressMsg('Warming up Deep Scan engine...');
    
    try {
      const { jobs: fetchedJobs, sources: fetchedSources } = await searchJobs(
        parseInt(age), 
        jobType,
        (msg) => setProgressMsg(msg)
      );
      setJobs(fetchedJobs);
      const processedSources = fetchedSources.map((chunk: any) => ({
        title: chunk.web?.title || 'Job Portal',
        uri: chunk.web?.uri || '#'
      })).filter(s => s.uri !== '#');
      setSources(processedSources);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING" || err.message === "API_KEY_INVALID") {
        setNeedsKey(true);
      }
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }, [age, jobType, loading]);

  if (needsKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Connect Deep Scan</h2>
          <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
            Select an API key to enable real-time tracking of Indian job portals.
            <br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Billing Documentation</a>
          </p>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg uppercase tracking-widest text-xs"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  const ongoingJobs = jobs.filter(j => !j.isUpcoming);
  const upcomingJobs = jobs.filter(j => j.isUpcoming);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-6xl font-[1000] text-slate-900 mb-4 tracking-tighter leading-none">
            Deep <span className="text-indigo-600">Scan</span> Discovery
          </h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto mb-8 text-sm sm:text-base px-4 leading-relaxed">
            Scouring regional portals and private boards across India for {age} year olds.
          </p>

          <form 
            onSubmit={handleSearch} 
            className="max-w-4xl mx-auto bg-slate-50 p-2 sm:p-3 rounded-[2rem] border-2 border-slate-100 flex flex-col sm:flex-row items-center gap-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-50 transition-all"
          >
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-4">Age</span>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-xl"
                min="16" max="60"
              />
            </div>
            <div className="hidden sm:block w-[2px] h-8 bg-slate-200"></div>
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-4">Type</span>
              <select 
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-base cursor-pointer"
              >
                <option value="All">All Jobs</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black px-12 py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Deep Scan"
              )}
            </button>
          </form>

          {loading && (
            <div className="mt-8 flex flex-col items-center animate-bounce">
              <div className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Live Status</div>
              <div className="text-slate-900 font-black text-sm">{progressMsg}</div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"></div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-16 pb-20">
            {ongoingJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Active Now</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified Opportunities</h3>
                  <div className="h-[2px] flex-grow bg-slate-50"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoingJobs.map((j, i) => <JobCard key={i} job={j} />)}
                </div>
              </section>
            )}

            {upcomingJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-orange-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Hidden/Advanced</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Scanning Upcoming Notifications</h3>
                  <div className="h-[2px] flex-grow bg-slate-50"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingJobs.map((j, i) => <JobCard key={i} job={j} />)}
                </div>
              </section>
            )}
          </div>
        ) : hasSearched && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Deep Scan came up empty</h3>
            <p className="text-slate-500 font-bold">Try adjusting filters or age criteria.</p>
          </div>
        )}

        {sources.length > 0 && !loading && (
          <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Scanning Sources ({sources.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all truncate">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
