
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import JobCard from './components/JobCard';
import { searchJobs } from './services/geminiService';
import { Job, GroundingSource } from './types';

const App: React.FC = () => {
  const [age, setAge] = useState<string>('21');
  const [jobType, setJobType] = useState<string>('All');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [manualKey, setManualKey] = useState<string>('');

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setIsFallback(false);
    setProgressMsg('Initiating Flash-Lite Engine...');
    
    try {
      const result = await searchJobs(
        parseInt(age), 
        jobType,
        (msg) => setProgressMsg(msg)
      );
      
      setJobs(result.jobs);
      setIsFallback(result.isFallback);
      
      const processedSources = result.sources.map((chunk: any) => ({
        title: chunk.web?.title || 'Official Source',
        uri: chunk.web?.uri || '#'
      })).filter(s => s.uri !== '#');
      setSources(processedSources);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }, [age, jobType]);

  const clearKey = () => {
    localStorage.removeItem('IJF_API_KEY');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-6 border border-indigo-100">
            <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Flash-Speed Engine</span>
          </div>
          
          <h2 className="text-6xl sm:text-8xl font-[1000] text-slate-900 mb-4 tracking-tighter uppercase italic leading-none">
            JOB <span className="text-indigo-600">LITE</span>
          </h2>
          <p className="text-slate-500 font-bold mb-10 max-w-lg mx-auto text-sm sm:text-base">Instant eligibility-based job discovery across India.</p>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100 flex flex-col sm:flex-row items-center gap-2 shadow-sm transition-all focus-within:border-indigo-600">
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-4">Your Age</span>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-2xl" min="16" max="60"/>
            </div>
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2 border-t sm:border-t-0 sm:border-l border-slate-200">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-4">Sector</span>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-base cursor-pointer">
                <option value="All">All Jobs</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-5 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Fast Scan"}
            </button>
          </form>

          {loading && <p className="mt-8 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{progressMsg}</p>}
        </div>

        {isFallback && !loading && (
          <div className="mb-10 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center max-w-2xl mx-auto">
            <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest">
              Live Engine Busy • Showing Standard Trending Jobs
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((j, i) => <JobCard key={i} job={j} />)}
        </div>

        {hasSearched && jobs.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-black text-slate-900">No results found</h3>
            <p className="text-slate-500 font-bold mt-2">Try relaxing your age or sector filters.</p>
          </div>
        )}

        <div className="mt-24 border-t border-slate-100 pt-12 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-8">
            <button onClick={() => setShowKeyModal(true)} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Update API Key
            </button>
            <button onClick={clearKey} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Engine
            </button>
          </div>
        </div>

        {showKeyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-2 border-slate-100">
              <h3 className="text-3xl font-[1000] text-slate-900 mb-4 tracking-tighter uppercase italic">Engine Setup</h3>
              <p className="text-slate-500 text-xs font-bold mb-8 leading-relaxed">
                To activate the real-time lightning-speed scanner, please provide a free Gemini API key. 
                <br/><br/>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 underline">Get a free key here →</a>
              </p>
              <input 
                type="password" 
                placeholder="Paste your key here..." 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-5 text-sm mb-6 focus:border-indigo-600 focus:outline-none transition-all"
                onChange={(e) => setManualKey(e.target.value)}
              />
              <div className="flex flex-col gap-3">
                <button onClick={() => {
                  if(manualKey) localStorage.setItem('IJF_API_KEY', manualKey);
                  setShowKeyModal(false);
                  handleSearch();
                }} className="w-full bg-indigo-600 text-white font-[1000] py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 active:scale-95 transition-all">Save & Continue</button>
                <button onClick={() => setShowKeyModal(false)} className="w-full bg-slate-50 text-slate-400 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Maybe Later</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
