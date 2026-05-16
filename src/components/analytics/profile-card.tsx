'use client';

import React from 'react';
import { UserCheck, Link2, MousePointer2 } from 'lucide-react';
import { Skeleton, StatBlock } from './primitives';

interface ProfileCardProps {
  visits: number;
  taps: number;
  isLoading?: boolean;
}

export function ProfileCard({ visits, taps, isLoading = false }: ProfileCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 h-full min-h-[300px]">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div>
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-auto pt-8 border-t border-[#222]">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 h-full flex flex-col min-h-[300px] transition-all duration-300 hover:border-white/10 group">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white tracking-tight">Profile activity</h3>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10 opacity-40 group-hover:opacity-100 transition-opacity">
          <UserCheck className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden">
           <div className="absolute -left-4 top-0 w-1 h-full bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
           <StatBlock 
             value={visits} 
             label="Profile visits" 
           />
        </div>

        <div className="relative overflow-hidden">
           <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
           <div className="flex items-start justify-between">
              <StatBlock 
                value={taps} 
                label="Website taps" 
              />
              <Link2 className="w-4 h-4 text-[#444] mt-2 group-hover:text-emerald-500 transition-colors" />
           </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[#222] flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#555] uppercase font-bold tracking-widest mb-0.5">Total visits</div>
          <div className="text-sm font-bold text-[#ccc] group-hover:text-white transition-colors">{(visits + taps).toLocaleString()}</div>
        </div>
        <MousePointer2 className="w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors" />
      </div>
    </div>
  );
}
