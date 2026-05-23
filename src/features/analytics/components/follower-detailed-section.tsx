'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Sparkles } from 'lucide-react';
import { getFollowerDetailedAnalyticsAction } from '@features/analytics/actions/analytics.actions';
import { AnalyticsRange } from '@features/analytics/types';

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
    <div className="space-y-6">
      {/* HEADER SECTION WITH DEMOGRAPHIC FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-base-100 border border-base-content/5 rounded-3xl p-6 shadow-xs">
        <div>
          <h3 className="text-lg font-black text-base-content tracking-tight flex items-center gap-2">
            <span>Nhân khẩu học khán giả</span>
          </h3>
          <p className="text-xs text-base-content/50 font-medium mt-1">
            Phân tích chi tiết hành vi, vị trí địa lý, độ tuổi và giới tính của tệp khán giả.
          </p>
        </div>

        {/* Premium Selector Switch using Pill styling */}
        <div className="flex p-0.5 bg-base-200/80 border border-base-content/5 rounded-2xl select-none self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setDemoType('followers')}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
              demoType === 'followers'
                ? "bg-primary text-primary-content shadow-sm font-extrabold"
                : "text-base-content/40 hover:text-base-content/75"
            }`}
          >
            Người theo dõi
          </button>
          <button
            onClick={() => setDemoType('engaged')}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
              demoType === 'engaged'
                ? "bg-primary text-primary-content shadow-sm font-extrabold"
                : "text-base-content/40 hover:text-base-content/75"
            }`}
          >
            Đã tương tác
          </button>
        </div>
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
