
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const isGov = job.type === 'Government';

  // Enhanced Structured Data for Google Jobs Widget
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": `${job.description}. Eligibility: ${job.eligibility}. This is a ${job.type} job located in ${job.location || 'India'}.`,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.organization,
      "sameAs": job.sourceUrl || "https://india-job-finder.vercel.app"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "Multiple Locations",
        "addressRegion": "India",
        "addressCountry": "IN"
      }
    },
    "datePosted": new Date().toISOString().split('T')[0],
    "validThrough": job.lastDate.match(/\d{4}/) ? job.lastDate : "2026-12-31",
    "employmentType": job.type === 'Government' ? "FULL_TIME" : "CONTRACTOR",
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "unitText": "MONTH"
      }
    }
  };
  
  return (
    <article className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 sm:p-7 flex flex-col h-full hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 group">
      {/* JSON-LD is crucial for Google Job Search integration */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      <div className="flex-grow">
        <div className="flex justify-between items-start mb-5">
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
            isGov ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'
          }`}>
            {job.type}
          </span>
          {job.isUpcoming && (
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">
              Upcoming Notification
            </span>
          )}
        </div>

        <h3 className="text-xl font-[1000] text-slate-900 leading-[1.2] mb-1 group-hover:text-indigo-600 transition-colors">
          {job.title}
        </h3>
        <h4 className="text-xs font-bold text-slate-400 mb-6 tracking-tight uppercase">{job.organization}</h4>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Deadline</span>
            <time className="text-xs font-black text-slate-900">{job.lastDate}</time>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Age Limit</span>
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
        aria-label={`Apply for ${job.title} at ${job.organization}`}
        className={`w-full py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 border-2 ${
          job.isUpcoming 
          ? 'border-slate-100 text-slate-900 hover:bg-slate-50' 
          : 'bg-slate-900 text-white border-slate-900 hover:bg-black'
        }`}
      >
        Official Notification
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </button>
    </article>
  );
};

export default JobCard;
