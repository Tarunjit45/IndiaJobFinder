
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
  const [error, setError] = useState<string | null>(null);
  
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [manualKey, setManualKey] = useState<string>('');

  const saveKey = () => {
    if (manualKey.trim().length > 10) {
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
    setProgressMsg('Waking up the engine...');
    
    try {
      const { jobs: fetchedJobs, sources: fetchedSources } = await searchJobs(
        parseInt(age), 
        jobType,
        (msg) => setProgressMsg(msg)
      );
      
      setJobs(fetchedJobs);
      const processedSources = fetchedSources.map((chunk: any) => ({
        title: chunk.web?.title || 'Official Source',
        uri: chunk.web?.uri || '#'
      })).filter(s => s.uri !== '#');
      setSources(processedSources);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING" || err.message === "API_KEY_INVALID") {
        setShowKeyModal(true);
      } else {
        setError('The search failed. This usually happens if the API is busy. Please try one more time.');
      }
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }, [age, jobType, loading]);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-6xl font-[1000] text-slate-900 mb-4 tracking-tighter leading-none uppercase">
            Job <span className="text-indigo-600">Deep Scan</span>
          </h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto mb-8 text-sm sm:text-base px-4 leading-relaxed">
            Searching thousands of Indian job portals in real-time.
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
                "Start Scan"
              )}
            </button>
          </form>

          {loading && (
            <div className="mt-8 flex flex-col items-center animate-pulse">
              <div className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Live Scanning...</div>
              <div className="text-slate-900 font-black text-sm">{progressMsg}</div>
            </div>
          )}

          {error && !showKeyModal && (
            <div className="mt-6 text-red-500 font-bold text-sm bg-red-50 py-2 px-6 rounded-full inline-block border border-red-100">
              {error}
            </div>
          )}
        </div>

        {showKeyModal && (
          <div className="max-w-md mx-auto mb-12 bg-white border-2 border-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Connect to Google AI</h3>
            <p className="text-slate-500 text-xs font-bold mb-6 leading-relaxed">
              Vercel is blocking the API Key. To use this app for free, get your own free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 underline">Google AI Studio</a> and paste it below. 
              <br/><span className="text-indigo-400 mt-2 block">It is stored only in your browser.</span>
            </p>
            <div className="space-y-3">
              <input 
                type="password"
                placeholder="Paste your API Key here..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button 
                onClick={saveKey}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Connect & Search
              </button>
            </div>
          </div>
        )}

        {!loading && jobs.length > 0 ? (
          <div className="space-y-16 pb-20">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Live Results</div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Opportunities</h3>
                <div className="h-[2px] flex-grow bg-slate-50"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((j, i) => <JobCard key={i} job={j} />)}
              </div>
            </section>
            
            {sources.length > 0 && (
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Scanning Verification Sources ({sources.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-all truncate block">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasSearched && !loading && !showKeyModal && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Scan Completed</h3>
            <p className="text-slate-500 font-bold">No exact matches found for your age criteria. Try a different category.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
