'use client';

import { SlidingTabs } from "@shared/ui";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Sparkles, Users, Heart } from 'lucide-react';
import { getFollowerDetailedAnalyticsAction } from '@features/analytics/actions/analytics.actions';
import { AnalyticsRange } from '@features/analytics/types';

const DEMO_TABS = [
  { value: 'followers' as const, label: 'Followers', icon: Users },
  { value: 'engaged' as const, label: 'Engaged', icon: Heart },
];

// Sub-components import
import { FollowerDetailedSkeleton } from './follower-detailed/FollowerDetailedSkeleton';
import { FollowerInsufficientDataState } from './follower-detailed/FollowerInsufficientDataState';
import { FollowerLocationsCard } from './follower-detailed/FollowerLocationsCard';
import { FollowerAgeCard } from './follower-detailed/FollowerAgeCard';
import { FollowerGenderCard } from './follower-detailed/FollowerGenderCard';
import { FollowerActiveTimesCard } from './follower-detailed/FollowerActiveTimesCard';
import { FollowerPersonaCard } from './follower-detailed/FollowerPersonaCard';

interface FollowerDetailedSectionProps {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
  activeTimes: Record<string, number[]> | null;
}

export function FollowerDetailedSection({
  accountId,
  range,
  customStart,
  customEnd,
  activeTimes
}: FollowerDetailedSectionProps) {
  const [demoType, setDemoType] = useState<'followers' | 'engaged'>('followers');

  // Query follower details using TanStack Query
  const { data: result, isPending, isError } = useQuery({
    queryKey: ['follower-details', accountId, range, customStart, customEnd],
    queryFn: () => getFollowerDetailedAnalyticsAction(accountId, range, customStart, customEnd),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!accountId,
  });

  if (isPending) {
    return <FollowerDetailedSkeleton />;
  }

  if (isError || !result || result.error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 text-center">
        <div className="p-4 bg-error/10 border border-error/20 rounded-full mb-4 text-error animate-pulse">
          <Info size={28} />
        </div>
        <h3 className="text-base-content font-bold mb-2 text-lg">Không thể lấy dữ liệu người theo dõi</h3>
        <p className="text-base-content/50 text-sm max-w-md font-medium">
          {result?.error || 'Vui lòng kiểm tra lại kết nối tài khoản hoặc thử lại sau.'}
        </p>
      </div>
    );
  }

  const details = result.data;
  const followersCount = details?.followersCount || 0;
  const username = details?.username || '';
  const insufficientData = details?.insufficientData ?? false;
  
  const rawDemographics = details?.demographics;
  const demographics = {
    followers: rawDemographics?.followers || {
      age: rawDemographics?.age || [],
      city: rawDemographics?.city || [],
      country: rawDemographics?.country || [],
      gender: rawDemographics?.gender || []
    },
    engaged: rawDemographics?.engaged || {
      age: rawDemographics?.engaged?.age || [],
      city: rawDemographics?.engaged?.city || [],
      country: rawDemographics?.engaged?.country || [],
      gender: rawDemographics?.engaged?.gender || []
    }
  };

  const currentDemographics = demoType === 'followers' ? demographics.followers : demographics.engaged;

  // 1. Under 100 followers warning state
  if (insufficientData) {
    return (
      <FollowerInsufficientDataState
        followersCount={followersCount}
        username={username}
      />
    );
  }

  return (
    <div className="p-6">
      {/* HEADER SECTION WITH DEMOGRAPHIC FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-base-content/5 mb-6">
        <div>
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-base-content">Nhân khẩu học khán giả</h2>
          </div>
        </div>

        {/* Premium Selector Switch using SlidingTabs */}
        <SlidingTabs
          items={DEMO_TABS}
          activeValue={demoType}
          onChange={setDemoType}
          size="sm"
          rounded="rounded-full"
          layoutId="demoTypeTabs"
          className="self-start sm:self-auto"
        />
      </div>

      {/* DEMOGRAPHICS GRID - PERFECT BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* ROW 1: HERO - AUDIENCE PERSONA CARD (10 columns width) */}
        <FollowerPersonaCard 
          followersCount={followersCount}
          demographics={currentDemographics}
          activeTimes={activeTimes}
        />

        {/* ROW 2: ACTIVE TIMES (6 columns) & LOCATIONS (4 columns) */}
        <div className="lg:col-span-6 flex flex-col">
          <FollowerActiveTimesCard
            activeTimes={activeTimes}
          />
        </div>
        
        <div className="lg:col-span-4 flex flex-col">
          <FollowerLocationsCard
            countryData={currentDemographics.country}
            cityData={currentDemographics.city}
            followersCount={followersCount}
          />
        </div>

        {/* ROW 3: AGE GROUPS (5 columns) & GENDER (5 columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <FollowerAgeCard
            ageData={currentDemographics.age}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <FollowerGenderCard
            genderDataRaw={currentDemographics.gender}
          />
        </div>

      </div>
    </div>
  );
}
