
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
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      const { jobs: fetchedJobs, sources: fetchedSources } = await searchJobs(parseInt(age), jobType);
      setJobs(fetchedJobs);
      const processedSources = fetchedSources.map((chunk: any) => ({
        title: chunk.web?.title || 'Job Portal',
        uri: chunk.web?.uri || '#'
      })).filter(s => s.uri !== '#');
      setSources(processedSources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [age, jobType, loading]);

  const ongoingJobs = jobs.filter(j => !j.isUpcoming);
  const upcomingJobs = jobs.filter(j => j.isUpcoming);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased selection:bg-indigo-100">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-6xl font-[1000] text-slate-900 mb-4 tracking-tighter leading-none">
            Deep <span className="text-indigo-600">Scan</span> Discovery
          </h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto mb-8 text-sm sm:text-base px-4 leading-relaxed">
            Finding hidden niche jobs, regional notifications, and private openings most trackers miss. 
            Real-time deep internet scan.
          </p>

          <form 
            onSubmit={handleSearch} 
            className="max-w-4xl mx-auto bg-slate-50 p-2 sm:p-3 rounded-[2rem] border-2 border-slate-100 flex flex-col sm:flex-row items-center gap-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-50 transition-all"
          >
            <div className="w-full sm:w-1/3 flex items-center px-6 py-2">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-4 whitespace-nowrap">Your Age</span>
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
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-4 whitespace-nowrap">Type</span>
              <select 
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-transparent text-slate-900 font-black focus:outline-none text-base appearance-none cursor-pointer"
              >
                <option value="All">All Jobs</option>
                <option value="Government">Government Only</option>
                <option value="Private">Private Only</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black px-12 py-4 rounded-[1.5rem] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Deep Scan</>
              )}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-50 rounded-[2rem] border border-slate-100"></div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-16 pb-20">
            {ongoingJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">Ongoing Opportunities</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Notifications</h3>
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
                  <div className="bg-orange-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">Upcoming / Hidden</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Advanced Discovery</h3>
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
            <h3 className="text-2xl font-black text-slate-900 mb-2">No results matched your criteria</h3>
            <p className="text-slate-500 font-bold">Try adjusting your age or searching "All Jobs".</p>
          </div>
        )}

        {sources.length > 0 && !loading && (
          <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Scanning Sources ({sources.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sources.map((s, i) => (
                <a 
                  key={i} 
                  href={s.uri} 
                  target="_blank" 
                  className="bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all truncate"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-slate-900 font-black text-2xl tracking-tighter">
            IndiaJobFinder
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-xl mx-auto leading-relaxed">
            The Deep Scan engine looks beyond popular aggregators to find regional department jobs, startup openings, and niche technical roles.
          </p>
          <div className="flex justify-center gap-8 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Fast Scan</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Verified URLS</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Zero Limits</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
