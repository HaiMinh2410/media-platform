import React from 'react';
import { Calendar, MoreHorizontal } from 'lucide-react';
import { Lead } from './types';
import { cn } from '@shared/lib/utils';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <div 
      className="bg-base-100 rounded-xl p-4 border border-base-content/5 flex flex-col gap-3.5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20 group active:scale-98 shadow-xs"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="avatar placeholder shrink-0">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary/10 to-secondary/15 text-base-content flex items-center justify-center font-black text-sm border border-base-content/5 shadow-2xs group-hover:scale-105 transition-transform duration-300">
            {lead.avatar ? (
              <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
            ) : (
              <span>{lead.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-base-content truncate group-hover:text-primary transition-colors font-brand">
            {lead.name}
          </div>
          
          {/* Platform badge */}
          <div className="flex items-center gap-1.5 mt-1">
            {lead.platform === 'instagram' && (
              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-instagram/10 text-instagram uppercase tracking-widest font-mono">Instagram</span>
            )}
            {lead.platform === 'messenger' && (
              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-messenger/10 text-messenger uppercase tracking-widest font-mono">Messenger</span>
            )}
            {lead.platform === 'unknown' && (
              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-base-200 text-base-content/50 uppercase tracking-widest font-mono">Trực tiếp</span>
            )}
            <span className="text-2xs font-bold text-base-content/40 before:content-['•'] before:mr-1 before:opacity-30 uppercase tracking-wider">{lead.source}</span>
          </div>
        </div>

        <button className="btn btn-xs btn-ghost btn-square rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-base-200">
          <MoreHorizontal size={14} className="text-base-content/60" />
        </button>
      </div>
      
      {/* Footer card */}
      <div className="flex justify-between items-center pt-2.5 border-t border-base-content/5 text-2xs text-base-content/40 font-mono">
        <span className="flex items-center gap-1 font-bold">
          <Calendar size={11} className="opacity-80" />
          {lead.date}
        </span>
        <span className="badge badge-xs badge-soft font-black tracking-widest rounded-md px-1.5">ID: {lead.id}</span>
      </div>
    </div>
  );
}
