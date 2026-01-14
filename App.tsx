
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
    setProgressMsg('Scanning for opportunities...');
    
    try {
      const result = await searchJobs(
        parseInt(age), 
        jobType,
        (msg) => setProgressMsg(msg)
      );
      
      setJobs(result.jobs);
      setIsFallback(result.isFallback);
      
      const processedSources = result.sources.map((chunk: any) => ({
        title: chunk.web?.title || 'Official Portal',
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
          <h2 className="text-5xl sm:text-7xl font-[1000] text-slate-900 mb-4 tracking-tighter uppercase italic">
            JOB <span className="text-indigo-600">SCANNER</span>
          </h2>
          <p className="text-slate-500 font-bold mb-8">India's real-time eligibility-first job search engine.</p>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100 flex flex-col sm:flex-row items-center gap-2 shadow-sm transition-all">
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-4">Age</span>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-xl" min="16" max="60"/>
            </div>
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2 border-t sm:border-t-0 sm:border-l border-slate-200">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-4">Type</span>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-base cursor-pointer">
                <option value="All">All Sectors</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black px-10 py-5 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">
              {loading ? "Scanning..." : "Search Jobs"}
            </button>
          </form>

          {loading && <p className="mt-6 text-indigo-600 font-black text-xs uppercase animate-pulse">{progressMsg}</p>}
        </div>

        {isFallback && !loading && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
            <p className="text-amber-800 text-xs font-bold">⚠️ Live AI is currently busy. Showing popular trending jobs for your age.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((j, i) => <JobCard key={i} job={j} />)}
        </div>

        {hasSearched && jobs.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-black text-slate-900">No matching jobs found</h3>
            <p className="text-slate-500 font-bold mt-2">Try adjusting your age or sector filters.</p>
          </div>
        )}

        <div className="mt-20 border-t border-slate-100 pt-10 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">API Controls</p>
          <div className="flex gap-4">
            <button onClick={() => setShowKeyModal(true)} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Update API Key</button>
            <button onClick={clearKey} className="text-[10px] font-bold text-red-500 hover:underline uppercase">Reset App</button>
          </div>
        </div>

        {showKeyModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">API SETUP</h3>
              <p className="text-slate-500 text-xs font-bold mb-6 leading-relaxed">To get real-time live data, enter a free Gemini API key from Google AI Studio. Leave empty to use standard data.</p>
              <input 
                type="password" 
                placeholder="Paste API Key here..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm mb-4"
                onChange={(e) => setManualKey(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => {
                  if(manualKey) localStorage.setItem('IJF_API_KEY', manualKey);
                  setShowKeyModal(false);
                  handleSearch();
                }} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest">Save & Scan</button>
                <button onClick={() => setShowKeyModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-xl text-xs uppercase tracking-widest">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
