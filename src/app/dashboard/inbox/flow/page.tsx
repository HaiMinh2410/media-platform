'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Flame, 
  Star, 
  Clock, 
  CheckCircle2, 
  Command,
  ArrowRight,
  TrendingUp,
  Target,
  Users,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useInboxStore } from '../store/inbox.store';
import { cn } from '@/lib/utils';

export default function FlowPage() {
  const { setViewMode } = useInboxStore();
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  const missions = [
    { id: '1', title: 'Reply to 5 Hot Leads', category: 'Sales', count: 5, icon: <Flame size={16} /> },
    { id: '2', title: 'Review 2 AI Escalations', category: 'Support', count: 2, icon: <Zap size={16} /> },
    { id: '3', title: 'Check-in with VIP Clients', category: 'Relation', count: 3, icon: <Star size={16} /> },
    { id: '4', title: 'Clear 10 Pending Inquiries', category: 'General', count: 10, icon: <Clock size={16} /> },
  ];

  const toggleMission = (id: string) => {
    setCompletedMissions(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const progress = (completedMissions.length / missions.length) * 100;

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.05),transparent)]">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <Link 
            href="/dashboard/inbox" 
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 text-foreground-tertiary transition-all duration-200 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:-translate-x-0.5"
            onClick={() => setViewMode('all')}
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[2.5rem] font-extrabold m-0 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">Daily Flow</h1>
        </div>
        <p className="text-foreground-secondary text-[1.1rem]">Focus on what matters. Your mission-critical tasks for today.</p>
      </header>

      <div className="grid grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-5 text-[1.25rem] font-semibold text-foreground">
            <TrendingUp size={20} className="text-indigo-400" />
            <h2>Priority Queue</h2>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-10">
            <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl p-6 rounded-[24px] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/20 group relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-rose-500/10 text-rose-500">
                <Flame size={24} />
              </div>
              <div className="text-[2rem] font-bold mb-1">12</div>
              <div className="text-foreground-secondary text-sm font-medium">High Intent Leads</div>
              <div className="mt-3 h-1 bg-rose-500/20 rounded-full">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl p-6 rounded-[24px] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/20 group relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-amber-500/10 text-amber-500">
                <Star size={24} />
              </div>
              <div className="text-[2rem] font-bold mb-1">4</div>
              <div className="text-foreground-secondary text-sm font-medium">VIP Conversations</div>
              <div className="mt-3 h-1 bg-amber-500/20 rounded-full">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl p-6 rounded-[24px] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/20 group relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-violet-500/10 text-violet-500">
                <Zap size={24} />
              </div>
              <div className="text-[2rem] font-bold mb-1">3</div>
              <div className="text-foreground-secondary text-sm font-medium">AI Escalations</div>
              <div className="mt-3 h-1 bg-violet-500/20 rounded-full">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5 text-[1.25rem] font-semibold text-foreground">
            <Target size={20} className="text-emerald-400" />
            <h2>Mission Queue</h2>
          </div>

          <div className="flex flex-col gap-4">
            {missions.map(mission => (
              <div 
                key={mission.id} 
                className={cn(
                  "bg-white/[0.02] border border-white/10 p-5 rounded-[20px] flex items-center gap-5 transition-all hover:bg-white/[0.05]",
                  completedMissions.includes(mission.id) && "opacity-60"
                )}
              >
                <button 
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 border-white/10 flex items-center justify-center transition-all",
                    completedMissions.includes(mission.id) ? "bg-green-500 border-green-500 text-white" : "text-transparent"
                  )} 
                  onClick={() => toggleMission(mission.id)}
                >
                  <CheckCircle2 size={16} />
                </button>
                <div className="flex-1">
                  <div className={cn("font-semibold mb-1", completedMissions.includes(mission.id) && "line-through")}>
                    {mission.title}
                  </div>
                  <div className="text-[0.8125rem] text-foreground-tertiary flex gap-3">
                    <span className="flex items-center gap-1">
                      {mission.icon}
                      {mission.category}
                    </span>
                    <span>•</span>
                    <span>{mission.count} items remaining</span>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-[0.875rem] border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]">
                  Start Flow <ArrowRight size={14} className="ml-1 inline" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-8">
          <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px]">
            <div className="text-[0.875rem] font-semibold text-foreground-secondary mb-4 uppercase tracking-wider">Daily Progress</div>
            <div className="flex justify-between text-[0.875rem] mb-2">
              <span className="text-foreground-tertiary">Completed</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[0.875rem] mt-4 mb-2">
              <span className="text-foreground-tertiary">Response Rate</span>
              <span className="font-semibold text-emerald-400">98.4%</span>
            </div>
            <div className="flex justify-between text-[0.875rem] mb-2">
              <span className="text-foreground-tertiary">Avg. Handle Time</span>
              <span className="font-semibold">2m 45s</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px]">
            <div className="text-[0.875rem] font-semibold text-foreground-secondary mb-4 uppercase tracking-wider">Team Activity</div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">JD</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Jane Doe</div>
                  <div className="text-xs text-slate-400">Resolved 12 tickets</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">AS</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Alex Smith</div>
                  <div className="text-xs text-slate-400">Online • 5 active chats</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-5 bg-white/[0.02] border border-white/10 rounded-[24px] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-tertiary">
              <Command size={16} />
              <span>Command Center</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-tertiary">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10">K</kbd>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
