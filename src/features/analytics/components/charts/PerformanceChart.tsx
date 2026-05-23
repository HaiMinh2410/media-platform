/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, Sparkles, TrendingUp } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---
const COLOR_REACH = 'var(--color-info)';
const COLOR_VIEWS = 'var(--color-secondary)';
const COLOR_ENGAGEMENT = 'var(--color-warning)';
const COLOR_INTERACTIONS = 'var(--color-success)';
const COLOR_BACKGROUND_VAR = 'var(--color-base-100)';

const RATE_EXCELLENT_REACH = 15;
const RATE_GOOD_REACH = 5;

const RATE_EXCELLENT_VIEWS = 6;
const RATE_GOOD_VIEWS = 2;

interface PerformanceChartProps {
  chartData: any[];
  range: string;
  avgReach: number;
  avgEngagement: number;
  avgEngagementRate: number;
  engagementInsight: any;
  avgViews: number;
  avgInteractions: number;
  avgInteractionRate: number;
  interactionInsight: any;
}

export function PerformanceChart({
  chartData,
  range,
  avgReach,
  avgEngagement,
  avgEngagementRate,
  engagementInsight,
  avgViews,
  avgInteractions,
  avgInteractionRate,
  interactionInsight,
}: PerformanceChartProps) {
  const [viewMode, setViewMode] = useState<'reach' | 'views'>('reach');

  const getRateColorClass = (rate: number, isReachMode: boolean) => {
    const excellent = isReachMode ? RATE_EXCELLENT_REACH : RATE_EXCELLENT_VIEWS;
    const good = isReachMode ? RATE_GOOD_REACH : RATE_GOOD_VIEWS;

    if (rate >= excellent) return 'text-success';
    if (rate >= good) return 'text-info';
    return 'text-warning';
  };

  const activeInsight = viewMode === 'reach' ? engagementInsight : interactionInsight;
  const isReachMode = viewMode === 'reach';

  return (
    <div className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-md">
      
      {/* 1. HEADER SECTION (Tiêu đề & Bộ chuyển đổi Switcher) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-content/5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
            <Icon 
              lucide={isReachMode ? Users : Eye} 
              size={18} 
              className={isReachMode ? 'text-info' : 'text-secondary'} 
            />
            {isReachMode ? 'So sánh Tiếp cận & Tương tác' : 'So sánh Lượt hiển thị & Tương tác'}
          </h3>
          <p className="text-base-content/40 text-xs font-medium">
            {isReachMode 
              ? 'Xem mối tương quan giữa số người tiếp cận (Reach) và người tương tác thực tế (Engagement)'
              : 'Theo dõi mối quan hệ giữa tổng lượt hiển thị (Views) và tổng lượt tương tác nhận được (Interactions)'}
          </p>
        </div>

        {/* VIEW SWITCHER (MINI SWITCHER) */}
        <div className="flex bg-base-200/80 border border-base-content/5 p-1 rounded-xl relative self-start sm:self-center shrink-0">
          <button
            onClick={() => setViewMode('reach')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative z-10 ${
              isReachMode 
                ? 'bg-info text-info-content shadow-xs scale-[1.02]' 
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <Icon lucide={Users} size={12} className={isReachMode ? 'text-info-content' : 'text-info'} />
            Theo Reach
          </button>
          <button
            onClick={() => setViewMode('views')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative z-10 ${
              !isReachMode 
                ? 'bg-secondary text-secondary-content shadow-xs scale-[1.02]' 
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <Icon lucide={Eye} size={12} className={!isReachMode ? 'text-secondary-content' : 'text-secondary'} />
            Theo Views
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT (Layout Grid 3 cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* CỘT TRÁI (CHIẾM 2 PHẦN) - BIỂU ĐỒ */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          <div style={{ width: '100%', height: '370px' }} className="relative text-base-content/70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  dy={10}
                  interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      
                      if (isReachMode) {
                        const reachVal = data.reach || 0;
                        const engVal = data.engagement || 0;
                        const dailyRate = reachVal > 0 ? ((engVal / reachVal) * 100).toFixed(2) : '0';

                        return (
                          <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                            <div className="text-xs font-bold text-base-content/40 border-b border-base-content/10 pb-1 mb-1 font-mono">
                              {data.date}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-info" />
                                <span>Reach (Tiếp cận):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">{reachVal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                                <span>Tương tác:</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">{engVal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                              <span className="text-xs font-medium text-base-content/30">Tỷ lệ tương tác ngày:</span>
                              <span className={`text-xs font-bold font-mono ${getRateColorClass(Number(dailyRate), true)}`}>
                                {dailyRate}%
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const viewsVal = data.views || 0;
                        const engVal = data.engagement || 0;
                        const dailyRate = viewsVal > 0 ? ((engVal / viewsVal) * 100).toFixed(2) : '0';

                        return (
                          <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                            <div className="text-xs font-bold text-base-content/40 border-b border-base-content/10 pb-1 mb-1 font-mono">
                              {data.date}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                                <span>Views (Lượt hiển thị):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">{viewsVal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                                <span>Tương tác (Interactions):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">{engVal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                              <span className="text-xs font-medium text-base-content/30">Tỷ lệ tương tác ngày:</span>
                              <span className={`text-xs font-bold font-mono ${getRateColorClass(Number(dailyRate), false)}`}>
                                {dailyRate}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                  cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    let label = '';
                    if (isReachMode) {
                      label = value === 'mainLine' ? 'Accounts Reached (Tiếp cận)' : 'Accounts Engaged (Tương tác)';
                    } else {
                      label = value === 'mainLine' ? 'Views (Lượt hiển thị)' : 'Interactions (Tương tác)';
                    }
                    return <span className="text-xs font-semibold text-base-content/70 hover:text-base-content transition-colors">{label}</span>;
                  }}
                />
                
                {/* MAIN DISTRIBUTIVE LINE (REACH or VIEWS) */}
                <Line 
                  type="monotone" 
                  dataKey={isReachMode ? 'reach' : 'views'} 
                  name="mainLine"
                  stroke={isReachMode ? COLOR_REACH : COLOR_VIEWS} 
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ 
                    r: 6, 
                    stroke: isReachMode ? COLOR_REACH : COLOR_VIEWS, 
                    strokeWidth: 2, 
                    fill: COLOR_BACKGROUND_VAR 
                  }}
                />

                {/* ENGAGEMENT LINE */}
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  name="engagementLine"
                  stroke={isReachMode ? COLOR_ENGAGEMENT : COLOR_INTERACTIONS} 
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ 
                    r: 6, 
                    stroke: isReachMode ? COLOR_ENGAGEMENT : COLOR_INTERACTIONS, 
                    strokeWidth: 2, 
                    fill: COLOR_BACKGROUND_VAR 
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CỘT PHẢI (CHIẾM 1 PHẦN) - THÔNG TIN CHI TIẾT & INSIGHT */}
        <div className="lg:col-span-1 flex flex-col gap-5 justify-between">
          
          {/* STATS CARDS (Xếp dọc trên desktop, xếp ngang trên mobile) */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 lg:grid-cols-1 gap-3 w-full"
            >
              {isReachMode ? (
                <>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Reach TB/Ngày</span>
                    <span className="text-base font-black text-info font-mono">{avgReach.toLocaleString()}</span>
                  </div>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Tương tác TB</span>
                    <span className="text-base font-black text-warning font-mono">{avgEngagement.toLocaleString()}</span>
                  </div>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Tỷ lệ tương tác</span>
                    <span className={`text-base font-black font-mono ${getRateColorClass(avgEngagementRate, true)}`}>
                      {avgEngagementRate}%
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Views TB/Ngày</span>
                    <span className="text-base font-black text-secondary font-mono">{avgViews.toLocaleString()}</span>
                  </div>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Tương tác TB</span>
                    <span className="text-base font-black text-success font-mono">{avgInteractions.toLocaleString()}</span>
                  </div>
                  <div className="bg-base-200/40 border border-base-content/5 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    <span className="text-[9px] text-base-content/40 uppercase font-bold tracking-wider block">Tỷ lệ tương tác</span>
                    <span className={`text-base font-black font-mono ${getRateColorClass(avgInteractionRate, false)}`}>
                      {avgInteractionRate}%
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* AI INSIGHT BLOCK */}
          <div className="flex-1 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              {activeInsight && (
                <motion.div 
                  key={viewMode}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 w-full ${activeInsight.color}`}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-base-content/5">
                    <div className="p-1 bg-base-content/5 rounded-lg flex items-center justify-center shrink-0">
                      <Icon lucide={activeInsight.icon} size={14} />
                    </div>
                    <h4 className="text-xs font-black text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                      <Icon lucide={Sparkles} size={12} className="text-accent" />
                      Phân tích AI
                    </h4>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-base-content">{activeInsight.title}</h5>
                    <p className="text-[11px] text-base-content/70 leading-relaxed font-medium">
                      {activeInsight.desc}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
}
