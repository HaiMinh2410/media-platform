'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, UserPlus, UserMinus, MapPin, Sparkles, TrendingUp, TrendingDown,
  Globe, Info, Award
} from 'lucide-react';
import { getFollowerDetailedAnalyticsAction } from '@/application/actions/analytics.actions';
import { AnalyticsRange } from '@/domain/types/analytics';
import { cn } from './primitives';

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowUnfollowItem {
  date: string;
  follows: number;
  unfollows: number;
}

interface FollowerDetailedSectionProps {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
}

export function FollowerDetailedSection({
  accountId,
  range,
  customStart,
  customEnd
}: FollowerDetailedSectionProps) {
  const [locationTab, setLocationTab] = useState<'country' | 'city'>('country');

  // Query follower details using TanStack Query
  const { data: result, isPending, isError } = useQuery({
    queryKey: ['follower-details', accountId, range, customStart, customEnd],
    queryFn: () => getFollowerDetailedAnalyticsAction(accountId, range, customStart, customEnd),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!accountId,
  });

  if (isPending) {
    return <SkeletonDetailedFollowers />;
  }

  if (isError || !result || result.error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-white/[0.02] rounded-3xl border border-white/5 p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-4 text-red-500">
          <Info size={28} />
        </div>
        <h3 className="text-white font-bold mb-2 text-lg">Không thể lấy dữ liệu người theo dõi</h3>
        <p className="text-white/40 text-sm max-w-md">
          {result?.error || 'Vui lòng kiểm tra lại kết nối tài khoản hoặc thử lại sau.'}
        </p>
      </div>
    );
  }

  const details = result.data;
  const followersCount = details?.followersCount || 0;
  const username = details?.username || '';
  const insufficientData = details?.insufficientData ?? false;
  const followsAndUnfollows: FollowUnfollowItem[] = details?.followsAndUnfollows || [];
  const demographics = details?.demographics || { age: [], city: [], country: [], gender: [] };

  // 1. Under 100 followers warning state
  if (insufficientData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#111] border border-[#222] rounded-3xl p-8 text-center font-sans shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/5">
          <Users size={28} className="animate-pulse" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Dữ liệu Người theo dõi hạn chế</h3>
        <p className="text-white/60 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
          Meta chỉ cung cấp thông tin chi tiết về nhân khẩu học và biến động người theo dõi cho các tài khoản Instagram có từ <span className="text-amber-400 font-bold">100 người theo dõi trở lên</span>.
        </p>
        
        <div className="inline-flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 min-w-[200px]">
          <span className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Followers hiện tại</span>
          <span className="text-4xl font-black text-white">{followersCount.toLocaleString()}</span>
          {username && <span className="text-xs text-amber-500/70 font-semibold mt-1">@{username}</span>}
        </div>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl max-w-md mx-auto flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-white/70 leading-relaxed">
            Hãy tiếp tục chia sẻ các nội dung thu hút, sử dụng Reels và đăng bài đều đặn để phát triển kênh của bạn lên mốc 100 followers nhé!
          </p>
        </div>
      </motion.div>
    );
  }

  // Calculate quick stats for follows and unfollows
  const totalFollows = followsAndUnfollows.reduce((sum: number, d: FollowUnfollowItem) => sum + (d.follows || 0), 0);
  const totalUnfollows = followsAndUnfollows.reduce((sum: number, d: FollowUnfollowItem) => sum + (d.unfollows || 0), 0);
  const netGrowth = totalFollows - totalUnfollows;
  const growthRate = totalUnfollows > 0 ? (totalFollows / totalUnfollows).toFixed(1) : totalFollows.toFixed(0);

  // Parse Demographics Locations
  const locations: DemographicItem[] = locationTab === 'country' ? demographics.country : demographics.city;
  const topLocations = locations.slice(0, 5);
  const maxLocationVal = topLocations.length > 0 ? Math.max(...topLocations.map((l: DemographicItem) => l.value)) : 100;
  const totalLocationVal = locations.reduce((sum: number, l: DemographicItem) => sum + l.value, 0) || 1;

  // Parse Gender Donut Chart
  const genderColors = {
    female: '#f43f5e', // Sleek Rose
    male: '#3b82f6',   // Sleek Blue
    unknown: '#9ca3af' // Sleek Gray
  };
  const rawGenders: DemographicItem[] = demographics.gender || [];
  const totalGenders = rawGenders.reduce((sum: number, g: DemographicItem) => sum + g.value, 0) || 1;

  const genderData = rawGenders.map((g: DemographicItem) => {
    let name = 'Khác';
    let color = genderColors.unknown;
    const lowerName = g.name.toLowerCase();

    if (lowerName === 'f' || lowerName.includes('female') || lowerName.includes('nữ')) {
      name = 'Nữ';
      color = genderColors.female;
    } else if (lowerName === 'm' || lowerName.includes('male') || lowerName.includes('nam')) {
      name = 'Nam';
      color = genderColors.male;
    }

    return {
      name,
      value: g.value,
      percentage: Math.round((g.value / totalGenders) * 100),
      color
    };
  }).filter((g: any) => g.value > 0);

  // Parse Age Progress Groups
  const ageData: DemographicItem[] = demographics.age || [];
  const topAge = ageData.slice(0, 5);
  const maxAgeVal = topAge.length > 0 ? Math.max(...topAge.map((a: DemographicItem) => a.value)) : 100;

  return (
    <div className="space-y-6 font-sans">
      
      {/* 2. TREND CHART: FOLLOWS & UNFOLLOWS DYNAMICS */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
        
        {/* Header and Summary stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Biến động Followers</h3>
              <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 text-white/50 rounded-full font-bold uppercase tracking-wider">
                IG Details
              </span>
            </div>
            <p className="text-xs text-white/40">Số lượng tài khoản bấm theo dõi và bỏ theo dõi hàng ngày</p>
          </div>

          <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 self-start md:self-auto">
            {/* Follows */}
            <div className="pr-6 border-r border-white/5">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <UserPlus size={14} />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Follows</span>
              </div>
              <span className="text-xl font-black text-white">{totalFollows.toLocaleString()}</span>
            </div>

            {/* Unfollows */}
            <div className="pr-6 border-r border-white/5">
              <div className="flex items-center gap-2 text-rose-500 mb-1">
                <UserMinus size={14} />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Unfollows</span>
              </div>
              <span className="text-xl font-black text-white">{totalUnfollows.toLocaleString()}</span>
            </div>

            {/* Net Growth */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {netGrowth >= 0 ? (
                  <TrendingUp size={14} className="text-emerald-400 animate-bounce" />
                ) : (
                  <TrendingDown size={14} className="text-rose-500 animate-bounce" />
                )}
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Tăng trưởng ròng</span>
              </div>
              <span className={cn(
                "text-xl font-black",
                netGrowth >= 0 ? "text-emerald-400" : "text-rose-500"
              )}>
                {netGrowth >= 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* The Recharts Area Chart */}
        <div className="w-full h-[320px]">
          {followsAndUnfollows.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/20 text-sm">Chưa có dữ liệu biến động cho khoảng thời gian này</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={followsAndUnfollows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnfollow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="follows" 
                  name="Follows"
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorFollow)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="unfollows" 
                  name="Unfollows"
                  stroke="#f43f5e" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorUnfollow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* 3. DEMOGRAPHICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD A: LOCATION TABS COUNTRY / CITY */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h4 className="font-bold text-white tracking-tight">Khu vực sinh sống</h4>
              </div>
              
              {/* Country / City Selector Tabs */}
              <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-xl select-none">
                <button
                  onClick={() => setLocationTab('country')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer",
                    locationTab === 'country' ? "bg-blue-500 text-white shadow" : "text-white/40 hover:text-white/80"
                  )}
                >
                  Quốc gia
                </button>
                <button
                  onClick={() => setLocationTab('city')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer",
                    locationTab === 'city' ? "bg-blue-500 text-white shadow" : "text-white/40 hover:text-white/80"
                  )}
                >
                  Thành phố
                </button>
              </div>
            </div>

            {topLocations.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <span className="text-white/20 text-xs">Không có dữ liệu vị trí</span>
              </div>
            ) : (
              <div className="space-y-4">
                {topLocations.map((loc: DemographicItem, idx: number) => {
                  const percent = Math.round((loc.value / totalLocationVal) * 100) || 0;
                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-white/70 group-hover:text-white transition-colors flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-400/70" />
                          {loc.name}
                        </span>
                        <span className="text-white font-bold">{percent}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-wider">
            <Award size={14} className="text-blue-400/50" />
            <span>Phân tích dựa trên {followersCount.toLocaleString()} followers</span>
          </div>
        </motion.div>

        {/* CARD B: AGE GROUPS */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Award size={18} className="text-emerald-400" />
              <h4 className="font-bold text-white tracking-tight">Nhóm tuổi phổ biến</h4>
            </div>

            {topAge.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <span className="text-white/20 text-xs">Không có dữ liệu độ tuổi</span>
              </div>
            ) : (
              <div className="space-y-4">
                {topAge.map((age: DemographicItem, idx: number) => {
                  const percent = Math.round((age.value / totalLocationVal) * 100) || 0; // standard percentage of total demographics
                  // Calculate dynamic percentage against max age count for cleaner horizontal bar visuals
                  const visualPct = Math.round((age.value / maxAgeVal) * 100) || 0;
                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-white/70 group-hover:text-white transition-colors">{age.name}</span>
                        <span className="text-white font-bold">{age.value.toLocaleString()} <span className="text-white/30 text-[10px] font-normal">({percent}%)</span></span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${visualPct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-emerald-400/50" />
            <span>Độ tuổi tập trung lớn nhất: {topAge[0]?.name || 'N/A'}</span>
          </div>
        </motion.div>

        {/* CARD C: GENDER DONUT PIE */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Users size={18} className="text-rose-400" />
              <h4 className="font-bold text-white tracking-tight">Tỷ lệ Giới tính</h4>
            </div>

            {genderData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <span className="text-white/20 text-xs">Không có dữ liệu giới tính</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Donut Chart container */}
                <div className="w-[150px] h-[150px] relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {genderData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Inside Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Giới tính</span>
                    <span className="text-sm font-black text-white">
                      {genderData[0]?.name || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Custom Legend list */}
                <div className="flex-1 space-y-3.5 w-full">
                  {genderData.map((gender: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: gender.color, boxShadow: `0 0 10px ${gender.color}30` }} />
                        <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">{gender.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">{gender.percentage}%</span>
                        <span className="block text-[8px] text-white/30 font-medium">({gender.value.toLocaleString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-wider">
            <Info size={14} className="text-rose-400/50" />
            <span>Cân bằng giới tính: {genderData[0]?.name || 'N/A'} chiếm ưu thế</span>
          </div>
        </motion.div>

      </div>

    </div>
  );
}

// Custom tooltip component for follows/unfollows AreaChart
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-2xl min-w-[140px] font-sans">
        <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">{label}</div>
        <div className="space-y-1.5">
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-white/70">{item.name}</span>
              </div>
              <span className="text-xs font-black text-white" style={{ color: item.color }}>
                +{item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// Internal component for statistics card loading skeletons
function SkeletonDetailedFollowers() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Chart Skeleton */}
      <div className="w-full h-[360px] bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent shimmer" />
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="w-36 h-5 bg-white/5 rounded" />
            <div className="w-24 h-3 bg-white/5 rounded" />
          </div>
          <div className="w-48 h-12 bg-white/5 rounded-2xl" />
        </div>
        <div className="w-full h-[200px] bg-white/5 rounded-xl mt-4" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 h-[320px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent shimmer" />
            <div className="w-32 h-5 bg-white/5 rounded mb-8" />
            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="w-20 h-3 bg-white/5 rounded" />
                    <div className="w-8 h-3 bg-white/5 rounded" />
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
