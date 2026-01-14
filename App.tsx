
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
  const [error, setError] = useState<string | null>(null);
  
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [manualKey, setManualKey] = useState<string>('');

  useEffect(() => {
    // Check if we already have a key. If not, we don't block the UI, 
    // but we'll show the modal if the search fails with MISSING_KEY.
    const key = localStorage.getItem('IJF_API_KEY');
    if (!key && !(process.env as any)?.API_KEY) {
      // Don't show immediately to avoid annoying users, wait for first search failure
    }
  }, []);

  const saveKey = () => {
    if (manualKey.trim()) {
      localStorage.setItem('IJF_API_KEY', manualKey.trim());
      setShowKeyModal(false);
      setError(null);
      handleSearch();
    }
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
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
        setShowKeyModal(true);
      } else {
        setError('Connection interrupted. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }, [age, jobType, loading, manualKey]);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-6xl font-[1000] text-slate-900 mb-4 tracking-tighter leading-none uppercase">
            Deep <span className="text-indigo-600">Scan</span>
          </h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto mb-8 text-sm sm:text-base px-4 leading-relaxed">
            Real-time tracking of Indian Government & Private sector jobs for {age} year olds.
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
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Deep Scan"
              )}
            </button>
          </form>

          {loading && (
            <div className="mt-8 flex flex-col items-center">
              <div className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Live Scan</div>
              <div className="text-slate-900 font-black text-sm">{progressMsg}</div>
            </div>
          )}

          {error && !showKeyModal && (
            <div className="mt-6 text-red-500 font-bold text-sm bg-red-50 py-2 px-4 rounded-full inline-block">
              {error}
            </div>
          )}
        </div>

        {showKeyModal && (
          <div className="max-w-md mx-auto mb-12 bg-indigo-50 border-2 border-indigo-100 p-8 rounded-[2rem] text-center">
            <h3 className="text-lg font-black text-slate-900 mb-2">API Configuration Required</h3>
            <p className="text-slate-500 text-xs font-bold mb-6 leading-relaxed">
              Environment variable detection failed. To use this app for free, get a free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" className="text-indigo-600 underline">AI Studio</a> and paste it below. It stays in your browser.
            </p>
            <div className="flex gap-2">
              <input 
                type="password"
                placeholder="Paste API Key here..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="flex-grow bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button 
                onClick={saveKey}
                className="bg-indigo-600 text-white font-black px-6 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"></div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-16 pb-20">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Found</div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Search Results</h3>
                <div className="h-[2px] flex-grow bg-slate-50"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((j, i) => <JobCard key={i} job={j} />)}
              </div>
            </section>
          </div>
        ) : hasSearched && !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">No jobs found</h3>
            <p className="text-slate-500 font-bold">Try different filters.</p>
          </div>
        )}

        {sources.length > 0 && !loading && (
          <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Grounding Sources ({sources.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-center">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-all truncate">
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
