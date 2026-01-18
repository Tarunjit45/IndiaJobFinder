
import React, { useState, useCallback, useEffect } from 'react';
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

  const [todayDisplay, setTodayDisplay] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    setTodayDisplay(formatted);
    setCurrentYear(now.getFullYear());
    
    document.title = `IndiaJobFinder | Free Live Job Search ${now.getFullYear()}`;
  }, []);

  useEffect(() => {
    if (hasSearched) {
      const typeLabel = jobType === 'All' ? 'Latest' : jobType;
      document.title = `${typeLabel} Jobs for Age ${age} | Verified ${todayDisplay}`;
    }
  }, [hasSearched, jobType, age, todayDisplay]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setIsFallback(false);
    setProgressMsg(`Waking up Flash Engine...`);
    
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
  }, [age, jobType, todayDisplay]);

  const clearKey = () => {
    localStorage.removeItem('IJF_API_KEY');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-6 border border-indigo-100 shadow-sm">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Flash Live: {todayDisplay}</span>
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-[1000] text-slate-900 mb-4 tracking-tighter uppercase italic leading-none">
            JOB <span className="text-indigo-600">FREE</span>
          </h1>
          <h2 className="text-slate-500 font-bold mb-10 max-w-lg mx-auto text-sm sm:text-base tracking-tight leading-relaxed">
            Instant high-speed scanning for <span className="text-slate-900 font-black">{todayDisplay}</span> jobs using the fastest free AI model.
          </h2>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-slate-50 p-2 rounded-[2.5rem] border-2 border-slate-200 flex flex-col sm:flex-row items-center gap-2 shadow-xl shadow-indigo-100/20 transition-all focus-within:border-indigo-600">
            <div className="w-full sm:w-1/3 flex flex-col items-start px-8 py-2">
              <label htmlFor="age-input" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Your Age</label>
              <input id="age-input" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-3xl" min="16" max="60"/>
            </div>
            <div className="w-full sm:w-1/3 flex flex-col items-start px-8 py-2 border-t sm:border-t-0 sm:border-l border-slate-200">
              <label htmlFor="sector-input" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Sector</label>
              <select id="sector-input" value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-xl cursor-pointer">
                <option value="All">All Jobs</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-6 rounded-[2rem] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-indigo-200">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : `Free Flash Search`}
            </button>
          </form>

          {loading && <p className="mt-8 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{progressMsg}</p>}
        </section>

        {isFallback && !loading && (
          <div className="mb-10 p-5 bg-amber-50 border border-amber-100 rounded-[2rem] text-center max-w-2xl mx-auto flex items-center justify-center gap-3">
             <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest">
              Free API Limit Reached • Showing Trending Local Jobs for {todayDisplay}
            </p>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((j, i) => <JobCard key={j.id + i} job={j} />)}
        </section>

        <footer className="mt-24 py-12 border-t border-slate-100 flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <button onClick={() => setShowKeyModal(true)} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Engine Config
              </button>
              <button onClick={clearKey} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                Reset
              </button>
            </div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">IndiaJobFinder Free Index © {currentYear}</p>
        </footer>

        {showKeyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl border-2 border-white">
              <h3 className="text-4xl font-[1000] text-slate-900 mb-4 tracking-tighter uppercase italic">Free Flash AI</h3>
              <p className="text-slate-500 text-xs font-bold mb-10 leading-relaxed">
                Unlock lightning-fast web scanning with a free Gemini API key. 
                <br/><br/>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 underline text-sm">Get free key now →</a>
              </p>
              <input type="password" placeholder="Paste API Key..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-6 text-sm mb-6 focus:border-indigo-600 focus:outline-none transition-all font-mono" onChange={(e) => setManualKey(e.target.value)}/>
              <div className="flex flex-col gap-3">
                <button onClick={() => {
                  if(manualKey) localStorage.setItem('IJF_API_KEY', manualKey);
                  setShowKeyModal(false);
                  handleSearch();
                }} className="w-full bg-slate-900 text-white font-[1000] py-6 rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all">Enable Free Scan</button>
                <button onClick={() => setShowKeyModal(false)} className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-3xl text-[10px] uppercase tracking-widest">Later</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
