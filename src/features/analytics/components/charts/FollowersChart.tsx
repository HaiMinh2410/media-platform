/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Bot, Star, Flame, AlertTriangle, BarChart2, Target } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFollowersInsightAction } from '@features/analytics/actions/analytics.actions';
import { PerformanceInsight } from '@features/analytics/types/performanceInsight';

// --- CONSTANTS (Clean Code: Tránh Magic Numbers) ---
const COLOR_FOLLOW = 'var(--color-success)';
const COLOR_UNFOLLOW = 'var(--color-error)';
const COLOR_TREND = 'var(--color-warning)';
const COLOR_BACKGROUND_VAR = 'var(--color-base-100)';

const RATING_CONFIG = {
  excellent: { label: 'Xuất sắc', color: 'text-success border-success/20 bg-success/5', icon: Flame, iconClass: 'text-success' },
  good:      { label: 'Tốt',      color: 'text-info border-info/20 bg-info/5',    icon: Star, iconClass: 'text-info' },
  average:   { label: 'Trung bình', color: 'text-warning border-warning/20 bg-warning/5', icon: AlertTriangle, iconClass: 'text-warning' },
  weak:      { label: 'Yếu',      color: 'text-error border-error/20 bg-error/5',     icon: AlertTriangle, iconClass: 'text-error' },
} as const;

// Client-side cache to prevent duplicate AI generation on tab switches
const followersInsightCache = new Map<string, { content: PerformanceInsight | null; modelUsed?: string }>();

interface FollowersChartProps {
  isInstagram: boolean;
  isFollowerInsufficientData: boolean;
  followsAndUnfollows: any[];
  totalFollows: number;
  totalUnfollows: number;
  netGrowth: number;
  chartData: any[];
  range: string;
  CustomTooltip: React.ComponentType<any>;
}

export function FollowersChart({
  isInstagram,
  isFollowerInsufficientData,
  followsAndUnfollows,
  totalFollows,
  totalUnfollows,
  netGrowth,
  chartData,
  range,
  CustomTooltip,
}: FollowersChartProps) {
  
  const [aiInsight, setAiInsight] = useState<PerformanceInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const isInstagramDynamics = isInstagram && !isFollowerInsufficientData;
  const ratio = totalFollows / (totalUnfollows || 1);

  useEffect(() => {
    if (!isInstagramDynamics) return;

    let active = true;
    
    const cacheKey = JSON.stringify({
      platform: 'instagram',
      totalFollows,
      totalUnfollows,
      netGrowth,
      range
    });

    if (followersInsightCache.has(cacheKey)) {
      const cached = followersInsightCache.get(cacheKey);
      setAiInsight(cached?.content || null);
      setModelUsed(cached?.modelUsed || '');
      return;
    }

    async function loadAIInsight() {
      setIsLoadingAI(true);
      setRateLimitMessage(null);
      try {
        const res = await generateFollowersInsightAction({
          platform: 'instagram',
          totalFollows,
          totalUnfollows,
          netGrowth,
          range
        });
        
        if (active) {
          if (res.content) {
            followersInsightCache.set(cacheKey, { content: res.content, modelUsed: res.modelUsed });
            setAiInsight(res.content);
            setModelUsed(res.modelUsed || '');
            setRateLimitMessage(null);
          } else {
            setAiInsight(null);
            setModelUsed('');
            if (res.error && (res.error.includes('rate_limit_exceeded') || res.error.includes('Please try again in'))) {
              const match = res.error.match(/Please try again in [^.]+/);
              if (match) {
                setRateLimitMessage(match[0]);
              } else {
                setRateLimitMessage("Please try again in a few minutes");
              }
            }
          }
        }
      } catch (err: any) {
        if (active) {
          setAiInsight(null);
          setModelUsed('');
          setRateLimitMessage(null);
        }
      } finally {
        if (active) {
          setIsLoadingAI(false);
        }
      }
    }

    loadAIInsight();

    return () => {
      active = false;
    };
  }, [isInstagramDynamics, totalFollows, totalUnfollows, netGrowth, range]);

  if (isInstagramDynamics) {
    const hasValidAiRating = aiInsight && aiInsight.rating && RATING_CONFIG[aiInsight.rating];
    const insightColor = hasValidAiRating
      ? RATING_CONFIG[aiInsight.rating].color
      : 'text-warning border-warning/20 bg-warning/5';

    const insightLabel = hasValidAiRating
      ? RATING_CONFIG[aiInsight.rating].label
      : '';

    return (
      <div className="w-full bg-base-100 border-t border-base-content/5 pt-4 flex flex-col gap-6 ">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-content/5">
            <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
              <Icon lucide={TrendingUp} size={18} className="text-warning" />
              Biến động Followers
            </h3>
        </div>

        {/* BODY CONTENT - GRID Layout 12 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI (CHIẾM 7 PHẦN) - BIỂU ĐỒ & THỐNG KÊ */}
          <div className="lg:col-span-8 flex flex-col gap-5 justify-between">
            
            {/* STATS CARDS (Xếp ngang trên một dòng) */}
            <div className="grid grid-cols-3 divide-x divide-base-content/10 w-full">
              <div className="flex flex-col pl-0 pr-4 py-1">
                <span className="text-xs text-base-content/40 font-medium">Follows mới</span>
                <span className="text-lg font-black text-success font-mono">{totalFollows.toLocaleString()}</span>
              </div>
              <div className="flex flex-col px-4 py-1">
                <span className="text-xs text-base-content/40 font-medium">Unfollows</span>
                <span className="text-lg font-black text-error font-mono">{totalUnfollows.toLocaleString()}</span>
              </div>
              <div className="flex flex-col pl-4 pr-0 py-1">
                <span className="text-xs text-base-content/40 font-medium">Tăng trưởng ròng</span>
                <span className={`text-lg font-black font-mono ${netGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                  {netGrowth >= 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
                </span>
              </div>
            </div>

            {/* AREA CHART */}
            <div style={{ width: '100%', height: '370px' }} className="relative text-base-content/70">
              {followsAndUnfollows.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-base-content/20 text-sm font-medium">Chưa có dữ liệu biến động cho khoảng thời gian này</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={followsAndUnfollows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_FOLLOW} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={COLOR_FOLLOW} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnfollow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_UNFOLLOW} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={COLOR_UNFOLLOW} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      dy={10}
                      tickFormatter={(value) => {
                        if (!value) return '';
                        if (value instanceof Date) {
                          const day = String(value.getDate()).padStart(2, '0');
                          const month = String(value.getMonth() + 1).padStart(2, '0');
                          return `${day}/${month}`;
                        }
                        if (typeof value === 'number') {
                          const d = new Date(value);
                          if (!isNaN(d.getTime())) {
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            return `${day}/${month}`;
                          }
                        }
                        if (typeof value === 'string') {
                          if (value.includes('-')) {
                            const parts = value.split('T')[0].split('-');
                            if (parts.length === 3) {
                              return `${parts[2]}/${parts[1]}`;
                            }
                          }
                          const d = new Date(value);
                          if (!isNaN(d.getTime())) {
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            return `${day}/${month}`;
                          }
                        }
                        return String(value);
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[140px]">
                              <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-2 font-mono">{label}</div>
                              <div className="space-y-1.5">
                                {payload.map((item: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                      <span className="text-xs font-semibold text-base-content/70">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black font-mono" style={{ color: item.color }}>
                                      +{item.value.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 1.5 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="follows" 
                      name="Follows"
                      stroke={COLOR_FOLLOW} 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorFollow)" 
                      dot={{ r: 0 }}
                      activeDot={{ r: 6, stroke: COLOR_FOLLOW, strokeWidth: 2, fill: COLOR_BACKGROUND_VAR }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="unfollows" 
                      name="Unfollows"
                      stroke={COLOR_UNFOLLOW} 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorUnfollow)" 
                      dot={{ r: 0 }}
                      activeDot={{ r: 6, stroke: COLOR_UNFOLLOW, strokeWidth: 2, fill: COLOR_BACKGROUND_VAR }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (CHIẾM 5 PHẦN) - PHÂN TÍCH AI */}
          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="flex-1 flex flex-col justify-end">
              <AnimatePresence mode="wait">
                {(isLoadingAI || aiInsight) ? (
                  <motion.div 
                    key="followersInsight"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300 w-full ${insightColor}`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-base-content/5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                          <Icon lucide={Bot} size={14} className={`${insightColor}`} />
                          Phân tích AI
                          {modelUsed && (
                            <span className="text-2xs font-mono lowercase opacity-40 px-1 py-0.5 rounded bg-base-content/5">
                              {modelUsed.replace('openai/', '').replace('llama-', '')}
                            </span>
                          )}
                        </h4>
                      </div>

                      {hasValidAiRating && (
                        <span className="text-xs font-bold px-2 py-0.5">
                          {insightLabel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {rateLimitMessage && (
                        <div className="alert alert-warning text-xs py-2 px-3 rounded-lg border border-warning/20 bg-warning/5 flex items-center gap-2">
                          <Icon lucide={AlertTriangle} size={14} className="text-warning shrink-0 animate-pulse" />
                          <span className="font-semibold text-base-content leading-normal">
                            {rateLimitMessage.replace('Please try again in', 'Đạt giới hạn lượt gọi AI. Vui lòng thử lại sau')}
                          </span>
                        </div>
                      )}
                      {isLoadingAI ? (
                        <div className="space-y-2 py-1 animate-pulse">
                          <div className="h-2 bg-base-content/20 rounded-md w-full" />
                          <div className="h-2 bg-base-content/20 rounded-md w-11/12" />
                          <div className="h-2 bg-base-content/20 rounded-md w-4/5" />
                          <div className="h-2 bg-base-content/10 rounded-md w-3/4 pt-1" />
                        </div>
                      ) : aiInsight ? (
                        <div className="flex flex-col gap-3 text-sm leading-relaxed">
                          <div className="font-medium text-base-content/90 flex items-start gap-2">
                            <Icon lucide={BarChart2} size={14} className="text-info shrink-0 mt-1.5" />
                            <span>{aiInsight.evaluation}</span>
                          </div>
                          <div className="bg-background/80 p-2 rounded-md text-base-content/80 font-medium flex items-start gap-2">
                            <Icon lucide={Target} size={14} className="text-success shrink-0 mt-1.5" />
                            <span>Kỳ vọng: {aiInsight.expectation}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : (
                  // Fallback fallbackInsight UI if AI fails or no data
                  <motion.div 
                    key="followersInsightFallback"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300 w-full text-warning border-warning/20 bg-warning/5`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-base-content/5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                          <Icon lucide={Bot} size={14} className="text-warning" />
                          Phân tích AI
                        </h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5">
                        {netGrowth >= 0 ? 'Tốt' : 'Yếu'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {rateLimitMessage && (
                        <div className="alert alert-warning text-xs py-2 px-3 rounded-lg border border-warning/20 bg-warning/5 flex items-center gap-2">
                          <Icon lucide={AlertTriangle} size={14} className="text-warning shrink-0 animate-pulse" />
                          <span className="font-semibold text-base-content/80 leading-normal">
                            {rateLimitMessage.replace('Please try again in', 'Đạt giới hạn lượt gọi AI. Vui lòng thử lại sau')}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col gap-3 text-sm leading-relaxed">
                        <div className="text-base-content/90 flex items-start gap-2">
                          <Icon lucide={BarChart2} size={14} className="text-info shrink-0 mt-1.5" />
                          <span>Tài khoản ghi nhận {totalFollows.toLocaleString()} lượt theo dõi mới và {totalUnfollows.toLocaleString()} lượt bỏ theo dõi, đem lại tăng trưởng ròng là {netGrowth >= 0 ? '+' : ''}{netGrowth.toLocaleString()} (tỷ lệ {ratio.toFixed(2)}x) trong {range}.</span>
                        </div>
                        <div className="bg-background/80 p-2 rounded-md text-base-content/80 font-medium flex items-start gap-2">
                          <Icon lucide={Target} size={14} className="text-success shrink-0 mt-1.5" />
                          <span>Kỳ vọng: Duy trì tăng trưởng dương ổn định, tăng thêm 500-1000 followers trong 30 ngày tới.</span>
                        </div>
                      </div>
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

  // General Trend
  return (
    <div className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-md">
      <div>
        <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
          <Icon lucide={TrendingUp} size={18} className="text-warning" />
          Xu hướng Followers
        </h3>
        <p className="text-base-content/40 text-xs mt-1 font-medium">
          Tổng số lượng người theo dõi tích lũy của trang theo thời gian
        </p>
      </div>

      <div style={{ width: '100%', height: '350px' }} className="relative mt-2 text-base-content/70">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_TREND} stopOpacity={0.4}/>
                <stop offset="50%" stopColor={COLOR_TREND} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={COLOR_TREND} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              dy={10}
              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
              tickFormatter={(value) => {
                if (!value) return '';
                if (value instanceof Date) {
                  const day = String(value.getDate()).padStart(2, '0');
                  const month = String(value.getMonth() + 1).padStart(2, '0');
                  return `${day}/${month}`;
                }
                if (typeof value === 'number') {
                  const d = new Date(value);
                  if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    return `${day}/${month}`;
                  }
                }
                if (typeof value === 'string') {
                  if (value.includes('-')) {
                    const parts = value.split('T')[0].split('-');
                    if (parts.length === 3) {
                      return `${parts[2]}/${parts[1]}`;
                    }
                  }
                  const d = new Date(value);
                  if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    return `${day}/${month}`;
                  }
                }
                return String(value);
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12, fontFamily: 'var(--font-mono)' }}
              domain={['dataMin - 100', 'dataMax + 100']}
              allowDecimals={false}
            />
            <Tooltip 
              content={<CustomTooltip activeMetric="followers" />}
              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 1.5 }}
            />
            <Area 
              type="monotone" 
              dataKey="followers" 
              stroke={COLOR_TREND} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFollowers)" 
              connectNulls
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: COLOR_TREND, strokeWidth: 2, fill: COLOR_BACKGROUND_VAR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
