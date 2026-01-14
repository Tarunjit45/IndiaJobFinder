
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const isGov = job.type === 'Government';
  
  return (
    <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 sm:p-7 flex flex-col h-full hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 group">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-5">
          <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
            isGov ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'
          }`}>
            {job.type}
          </div>
          {job.isUpcoming && (
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">
              Upcoming Notification
            </span>
          )}
        </div>

        <h3 className="text-xl font-[1000] text-slate-900 leading-[1.2] mb-1 group-hover:text-indigo-600 transition-colors">
          {job.title}
        </h3>
        <p className="text-xs font-bold text-slate-400 mb-6 tracking-tight uppercase">{job.organization}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Last Date</span>
            <span className="text-xs font-black text-slate-900">{job.lastDate}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Age Required</span>
            <span className="text-xs font-black text-slate-900">{job.ageLimit?.min || 18}-{job.ageLimit?.max || 45}y</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed italic line-clamp-2">
              "{job.eligibility}"
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {job.location || 'India'}
          </div>
        </div>
      </div>

      <button 
        onClick={() => window.open(job.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + job.organization + " notification official")}`, '_blank')}
        className={`w-full py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 border-2 ${
          job.isUpcoming 
          ? 'border-slate-100 text-slate-900 hover:bg-slate-50' 
          : 'bg-slate-900 text-white border-slate-900 hover:bg-black'
        }`}
      >
        View Official Site
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </button>
    </div>
  );
};

export default JobCard;
