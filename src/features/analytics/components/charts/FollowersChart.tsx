/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, UserPlus, UserMinus } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

// --- CONSTANTS (Clean Code: Tránh Magic Numbers) ---
const COLOR_FOLLOW = 'var(--color-success)';
const COLOR_UNFOLLOW = 'var(--color-error)';
const COLOR_TREND = 'var(--color-warning)';
const COLOR_BACKGROUND_VAR = 'var(--color-base-100)';

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
  
  const isInstagramDynamics = isInstagram && !isFollowerInsufficientData;

  if (isInstagramDynamics) {
    return (
      <div className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-md font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-base-content flex items-center gap-2 font-brand">
              <Icon lucide={TrendingUp} size={18} className="text-warning" />
              Biến động Followers
            </h3>
            <p className="text-base-content/40 text-xs mt-1 font-medium">Số lượng tài khoản bấm theo dõi và bỏ theo dõi hàng ngày</p>
          </div>

          <div className="flex items-center gap-6 bg-base-200/50 border border-base-content/5 rounded-2xl p-4 self-start md:self-auto">
            <div className="pr-6 border-r border-base-content/10">
              <div className="flex items-center gap-2 text-success mb-1">
                <Icon lucide={UserPlus} size={14} />
                <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Follows</span>
              </div>
              <span className="text-xl font-black font-mono text-base-content">{totalFollows.toLocaleString()}</span>
            </div>

            <div className="pr-6 border-r border-base-content/10">
              <div className="flex items-center gap-2 text-error mb-1">
                <Icon lucide={UserMinus} size={14} />
                <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Unfollows</span>
              </div>
              <span className="text-xl font-black font-mono text-base-content">{totalUnfollows.toLocaleString()}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                {netGrowth >= 0 ? (
                  <Icon lucide={TrendingUp} size={14} className="text-success animate-bounce" />
                ) : (
                  <Icon lucide={TrendingDown} size={14} className="text-error animate-bounce" />
                )}
                <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Tăng trưởng ròng</span>
              </div>
              <span className={`text-xl font-black font-mono ${netGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                {netGrowth >= 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-[350px] mt-2 relative text-base-content/70">
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
                        <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[140px] font-sans">
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
    );
  }

  // General Trend
  return (
    <div className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-md font-sans">
      <div>
        <h3 className="text-lg font-bold text-base-content flex items-center gap-2 font-brand">
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
