'use client';

import React, { useState } from 'react';
import styles from './flow.module.css';
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
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';

export default function FlowPage() {
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
    <div className={styles.flowContainer}>
      <header className={styles.header}>
        <h1>Daily Flow</h1>
        <p>Focus on what matters. Your mission-critical tasks for today.</p>
      </header>

      <div className={styles.dashboardGrid}>
        <div className={styles.mainContent}>
          <div className={styles.sectionTitle}>
            <TrendingUp size={20} className="text-indigo-400" />
            <h2>Priority Queue</h2>
          </div>
          
          <div className={styles.priorityGrid}>
            <div className={styles.priorityCard}>
              <div className={styles.cardIcon} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                <Flame size={24} />
              </div>
              <div className={styles.cardValue}>12</div>
              <div className={styles.cardLabel}>High Intent Leads</div>
              <div style={{ marginTop: '12px', height: '4px', background: 'rgba(244, 63, 94, 0.2)', borderRadius: '2px' }}>
                <div style={{ width: '70%', height: '100%', background: '#f43f5e', borderRadius: '2px' }} />
              </div>
            </div>

            <div className={styles.priorityCard}>
              <div className={styles.cardIcon} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                <Star size={24} />
              </div>
              <div className={styles.cardValue}>4</div>
              <div className={styles.cardLabel}>VIP Conversations</div>
              <div style={{ marginTop: '12px', height: '4px', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '2px' }}>
                <div style={{ width: '40%', height: '100%', background: '#eab308', borderRadius: '2px' }} />
              </div>
            </div>

            <div className={styles.priorityCard}>
              <div className={styles.cardIcon} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                <Zap size={24} />
              </div>
              <div className={styles.cardValue}>3</div>
              <div className={styles.cardLabel}>AI Escalations</div>
              <div style={{ marginTop: '12px', height: '4px', background: 'rgba(168, 85, 247, 0.2)', borderRadius: '2px' }}>
                <div style={{ width: '90%', height: '100%', background: '#a855f7', borderRadius: '2px' }} />
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>
            <Target size={20} className="text-emerald-400" />
            <h2>Mission Queue</h2>
          </div>

          <div className={styles.missionList}>
            {missions.map(mission => (
              <div 
                key={mission.id} 
                className={clsx(styles.missionItem, completedMissions.includes(mission.id) && styles.completed)}
              >
                <button className={styles.missionCheck} onClick={() => toggleMission(mission.id)}>
                  <CheckCircle2 size={16} />
                </button>
                <div className={styles.missionInfo}>
                  <div className={styles.missionTitle}>{mission.title}</div>
                  <div className={styles.missionMeta}>
                    <span className="flex items-center gap-1">
                      {mission.icon}
                      {mission.category}
                    </span>
                    <span>•</span>
                    <span>{mission.count} items remaining</span>
                  </div>
                </div>
                <button className={styles.actionButton}>
                  Start Flow <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>Daily Progress</div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Completed</span>
              <span className={styles.statValue}>{Math.round(progress)}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.statRow} style={{ marginTop: '16px' }}>
              <span className={styles.statLabel}>Response Rate</span>
              <span className={styles.statValue}>98.4%</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Avg. Handle Time</span>
              <span className={styles.statValue}>2m 45s</span>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>Team Activity</div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">JD</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Jane Doe</div>
                  <div className="text-xs text-slate-400">Resolved 12 tickets</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">AS</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Alex Smith</div>
                  <div className="text-xs text-slate-400">Online • 5 active chats</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.commandCenter}>
            <div className={styles.shortcutHint}>
              <Command size={16} />
              <span>Command Center</span>
            </div>
            <div className={styles.shortcutHint}>
              <kbd className={styles.kbd}>⌘</kbd>
              <kbd className={styles.kbd}>K</kbd>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
