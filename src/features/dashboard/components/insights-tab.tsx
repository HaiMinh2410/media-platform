'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Users, 
  Target, 
  MessageSquare, 
  GitCompare,
} from 'lucide-react';
import { SidebarItem } from './insights/sidebar-item';
import { useInsights } from './insights/use-insights';
import { LeadsInsights } from './insights/leads-insights';
import { PendingInsights } from './insights/pending-insights';

export function InsightsTab({ workspaceId }: { workspaceId: string }) {
  const {
    activeSidebar,
    setActiveSidebar,
    selectedGroupId,
    onChangeGroup,
    filters,
    onFilterChange,
    loading,
    totalLeadsCount,
    newLeadsCount,
    convertedLeadsCount,
    unqualifiedLeadsCount,
    lostLeadsCount,
    conversionRate,
    chartData,
    conversionRateDelta,
    conversionRateDirection,
    avgConversionTimeDays,
  } = useInsights(workspaceId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      {/* ─── A. SIDEBAR PHÂN TÍCH (BÊN TRÁI) ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 transition-all duration-300 shrink-0 rounded-xl lg:rounded-none lg:sticky lg:top-12 w-full lg:w-64">
        <div className="flex flex-col gap-1 w-full">
          <SidebarItem icon={LayoutDashboard} label="Tổng quan" active={activeSidebar === 'overview'} onClick={() => setActiveSidebar('overview')} />
          <SidebarItem icon={Calendar} label="Kế hoạch" active={activeSidebar === 'plan'} onClick={() => setActiveSidebar('plan')} />
          <SidebarItem icon={TrendingUp} label="Kết quả" active={activeSidebar === 'results'} onClick={() => setActiveSidebar('results')} />
          <SidebarItem icon={Users} label="Đối tượng" active={activeSidebar === 'audience'} onClick={() => setActiveSidebar('audience')} />
          <SidebarItem icon={Target} label="Khách hàng tiềm năng" active={activeSidebar === 'leads'} onClick={() => setActiveSidebar('leads')} />
          <SidebarItem icon={MessageSquare} label="Nhắn tin" active={activeSidebar === 'messages'} onClick={() => setActiveSidebar('messages')} />
          <SidebarItem icon={GitCompare} label="So sánh" active={activeSidebar === 'compare'} onClick={() => setActiveSidebar('compare')} />
        </div>
      </div>

      {/* ─── B. KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) ───────────────────────────── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 bg-transparent p-1 lg:p-2">
        {activeSidebar === 'leads' ? (
          <LeadsInsights
            workspaceId={workspaceId}
            selectedGroupId={selectedGroupId}
            onChangeGroup={onChangeGroup}
            filters={filters}
            onFilterChange={onFilterChange}
            loading={loading}
            newLeadsCount={totalLeadsCount}
            convertedLeadsCount={convertedLeadsCount}
            unqualifiedLeadsCount={unqualifiedLeadsCount}
            lostLeadsCount={lostLeadsCount}
            conversionRate={conversionRate}
            chartData={chartData}
            conversionRateDelta={conversionRateDelta}
            conversionRateDirection={conversionRateDirection}
            avgConversionTimeDays={avgConversionTimeDays}
          />
        ) : (
          <PendingInsights
            title={
              activeSidebar === 'overview' ? 'Phân tích Tổng quan' :
              activeSidebar === 'plan' ? 'Phân tích Kế hoạch' :
              activeSidebar === 'results' ? 'Phân tích Kết quả' :
              activeSidebar === 'audience' ? 'Phân tích Đối tượng' :
              activeSidebar === 'messages' ? 'Phân tích Nhắn tin' : 'Phân tích So sánh'
            }
          />
        )}
      </div>
    </div>
  );
}
