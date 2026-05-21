import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  Users, Eye, TrendingUp, TrendingDown, UserPlus, UserMinus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@shared/ui/icon';
import { SkeletonChart, CustomTooltip } from '@features/analytics/components/dashboard-states';

interface AnalyticsChartsSectionProps {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  totals: any;
  range: string;
  isInstagram: boolean;
  isFollowerInsufficientData: boolean;
  followsAndUnfollows: any[];
  totalFollows: number;
  totalUnfollows: number;
  netGrowth: number;
  chartData: any[];
  activeChart: 'reach-engagement' | 'views-interactions' | 'followers';
  setActiveChart: (chart: 'reach-engagement' | 'views-interactions' | 'followers') => void;
  avgReach: number;
  avgEngagement: number;
  avgEngagementRate: number;
  engagementInsight: any;
  avgViews: number;
  avgInteractions: number;
  avgInteractionRate: number;
  interactionInsight: any;
}

export function AnalyticsChartsSection({
  isPending,
  isError,
  isFetching,
  totals,
  range,
  isInstagram,
  isFollowerInsufficientData,
  followsAndUnfollows,
  totalFollows,
  totalUnfollows,
  netGrowth,
  chartData,
  activeChart,
  setActiveChart,
  avgReach,
  avgEngagement,
  avgEngagementRate,
  engagementInsight,
  avgViews,
  avgInteractions,
  avgInteractionRate,
  interactionInsight
}: AnalyticsChartsSectionProps) {
  return (
    <div className={`bg-foreground/2 border border-foreground/5 rounded-2xl p-6 min-h-[450px] transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
      {/* CHART SELECTOR BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-foreground/1 border border-foreground/10 p-2 rounded-2xl">
        <div className="flex flex-wrap p-1 bg-foreground/5 border border-foreground/10 rounded-xl select-none gap-1">
          <button
            onClick={() => setActiveChart('reach-engagement')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeChart === 'reach-engagement'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Icon lucide={Users} size={14} />
            Tiếp cận & Tương tác
          </button>
          <button
            onClick={() => setActiveChart('views-interactions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeChart === 'views-interactions'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Icon lucide={Eye} size={14} />
            Lượt xem & Tương tác
          </button>
          <button
            onClick={() => setActiveChart('followers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeChart === 'followers'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Icon lucide={TrendingUp} size={14} />
            {isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers'}
          </button>
        </div>

        <div className="text-foreground-secondary/40 text-xs font-semibold px-2">
          {activeChart === 'reach-engagement' && 'Hiệu suất thu hút (Reach vs Engagement)'}
          {activeChart === 'views-interactions' && 'Hiệu suất chuyển đổi (Views vs Interactions)'}
          {activeChart === 'followers' && (isInstagram && !isFollowerInsufficientData ? 'Biến động theo dõi kênh' : 'Biểu đồ tăng trưởng người theo dõi')}
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      {isPending ? (
        <SkeletonChart />
      ) : isError || !totals ? (
        <div className="w-full h-[350px] flex items-center justify-center bg-foreground/2 rounded-xl border border-foreground/10">
          <span className="text-foreground-secondary/40">No data available</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChart}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeChart === 'reach-engagement' && (
              /* Reach vs Engagement Comparison Chart */
              <div className="w-full glass rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Icon lucide={Users} size={18} className="text-blue-400" />
                      So sánh Tiếp cận & Tương tác
                    </h3>
                    <p className="text-foreground-secondary/50 text-xs mt-1">
                      Xem mối tương quan giữa số người tiếp cận (Reach) và người tương tác thực tế (Engagement)
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Reach TB/Ngày</span>
                      <span className="text-sm font-extrabold text-blue-400">{avgReach.toLocaleString()}</span>
                    </div>
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tương tác TB</span>
                      <span className="text-sm font-extrabold text-orange-400">{avgEngagement.toLocaleString()}</span>
                    </div>
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
                      <span className={`text-sm font-extrabold ${avgEngagementRate >= 15 ? 'text-emerald-400' : avgEngagementRate >= 5 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {avgEngagementRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '350px' }} className="relative mt-2 text-foreground-secondary">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                        dy={10}
                        interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const reachVal = data.reach || 0;
                            const engVal = data.engagement || 0;
                            const dailyRate = reachVal > 0 ? ((engVal / reachVal) * 100).toFixed(2) : '0';

                            return (
                              <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                                <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                                  {data.date}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>Reach (Tiếp cận):</span>
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{reachVal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span>Engagement (Tương tác):</span>
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{engVal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-1.5 mt-1">
                                  <span className="text-xs font-medium text-foreground-secondary/40">Tỷ lệ tương tác ngày:</span>
                                  <span className={`text-xs font-bold ${Number(dailyRate) >= 15 ? 'text-emerald-400' : Number(dailyRate) >= 5 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {dailyRate}%
                                  </span>
                                </div>
                              </div>
                            );
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
                          const label = value === 'reach' ? 'Accounts Reached (Tiếp cận)' : 'Accounts Engaged (Tương tác)';
                          return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reach" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#121212' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#121212' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {engagementInsight && (
                  <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${engagementInsight.color}`}>
                    <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
                      <Icon lucide={engagementInsight.icon} size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{engagementInsight.title}</h4>
                      <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                        {engagementInsight.desc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeChart === 'views-interactions' && (
              /* Views vs Interactions Comparison Chart */
              <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Icon lucide={Eye} size={18} className="text-purple-400" />
                      So sánh Lượt xem & Tương tác
                    </h3>
                    <p className="text-foreground-secondary/40 text-xs mt-1">
                      Theo dõi mối quan hệ giữa tổng lượt hiển thị (Views) và tổng lượt tương tác nhận được (Interactions)
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Views TB/Ngày</span>
                      <span className="text-sm font-extrabold text-purple-400">{avgViews.toLocaleString()}</span>
                    </div>
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tương tác TB</span>
                      <span className="text-sm font-extrabold text-emerald-400">{avgInteractions.toLocaleString()}</span>
                    </div>
                    <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                      <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
                      <span className={`text-sm font-extrabold ${avgInteractionRate >= 6 ? 'text-emerald-400' : avgInteractionRate >= 2 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {avgInteractionRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '350px' }} className="relative mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                        dy={10}
                        interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const viewsVal = data.views || 0;
                            const engVal = data.engagement || 0;
                            const dailyRate = viewsVal > 0 ? ((engVal / viewsVal) * 100).toFixed(2) : '0';

                            return (
                              <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                                <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                                  {data.date}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span>Views (Lượt xem):</span>
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{viewsVal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Interactions (Tương tác):</span>
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{engVal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-1.5 mt-1">
                                  <span className="text-xs font-medium text-foreground-secondary/40">Tỷ lệ tương tác ngày:</span>
                                  <span className={`text-xs font-bold ${Number(dailyRate) >= 6 ? 'text-emerald-400' : Number(dailyRate) >= 2 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {dailyRate}%
                                  </span>
                                </div>
                              </div>
                            );
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
                          const label = value === 'views' ? 'Views (Lượt xem)' : 'Interactions (Tương tác)';
                          return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#a855f7" 
                        strokeWidth={3}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2, fill: 'var(--bg-primary)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'var(--bg-primary)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {interactionInsight && (
                  <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${interactionInsight.color}`}>
                    <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
                      <Icon lucide={interactionInsight.icon} size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{interactionInsight.title}</h4>
                      <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                        {interactionInsight.desc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeChart === 'followers' && (
              /* Followers chart: dynamics or trend */
              <>
                {isInstagram && !isFollowerInsufficientData ? (
                  <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Icon lucide={TrendingUp} size={18} className="text-orange-400" />
                          Biến động Followers
                        </h3>
                        <p className="text-foreground-secondary/40 text-xs mt-1">Số lượng tài khoản bấm theo dõi và bỏ theo dõi hàng ngày</p>
                      </div>

                      <div className="flex items-center gap-6 bg-foreground/1 border border-foreground/10 rounded-2xl p-4 self-start md:self-auto">
                        <div className="pr-6 border-r border-foreground/10">
                          <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <Icon lucide={UserPlus} size={14} />
                            <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Follows</span>
                          </div>
                          <span className="text-xl font-black text-foreground">{totalFollows.toLocaleString()}</span>
                        </div>

                        <div className="pr-6 border-r border-foreground/10">
                          <div className="flex items-center gap-2 text-rose-500 mb-1">
                            <Icon lucide={UserMinus} size={14} />
                            <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Unfollows</span>
                          </div>
                          <span className="text-xl font-black text-foreground">{totalUnfollows.toLocaleString()}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {netGrowth >= 0 ? (
                              <Icon lucide={TrendingUp} size={14} className="text-emerald-400 animate-bounce" />
                            ) : (
                              <Icon lucide={TrendingDown} size={14} className="text-rose-500 animate-bounce" />
                            )}
                            <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Tăng trưởng ròng</span>
                          </div>
                          <span className={`text-xl font-black ${netGrowth >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {netGrowth >= 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-[350px] mt-2 relative">
                      {followsAndUnfollows.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-foreground/20 text-sm">Chưa có dữ liệu biến động cho khoảng thời gian này</span>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10 }}
                              allowDecimals={false}
                            />
                            <Tooltip 
                              content={({ active, payload, label }: any) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-3 rounded-2xl shadow-2xl min-w-[140px] font-sans">
                                      <div className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider mb-2">{label}</div>
                                      <div className="space-y-1.5">
                                        {payload.map((item: any, i: number) => (
                                          <div key={i} className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                              <span className="text-xs font-medium text-foreground-secondary">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-foreground" style={{ color: item.color }}>
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
                              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 1 }}
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
                  </div>
                ) : (
                  <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Icon lucide={TrendingUp} size={18} className="text-orange-400" />
                        Xu hướng Followers
                      </h3>
                      <p className="text-foreground-secondary/40 text-xs mt-1">
                        Tổng số lượng người theo dõi tích lũy của trang theo thời gian
                      </p>
                    </div>

                    <div style={{ width: '100%', height: '350px' }} className="relative mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                              <stop offset="50%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                            dy={10}
                            interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                            domain={['dataMin - 100', 'dataMax + 100']}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            content={<CustomTooltip activeMetric="followers" />}
                            cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="followers" 
                            stroke="#f97316" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorFollowers)" 
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
