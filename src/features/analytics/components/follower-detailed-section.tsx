'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
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
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 text-center font-sans">
        <div className="p-4 bg-error/10 border border-error/20 rounded-full mb-4 text-error animate-pulse">
          <Info size={28} />
        </div>
        <h3 className="text-base-content font-bold mb-2 text-lg font-brand">Không thể lấy dữ liệu người theo dõi</h3>
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
  const demographics = details?.demographics || { age: [], city: [], country: [], gender: [] };

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
    <div className="space-y-6 font-sans">
      {/* DEMOGRAPHICS GRID - PERFECT BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* ROW 1: HERO - AUDIENCE PERSONA CARD (10 columns width) */}
        <FollowerPersonaCard 
          followersCount={followersCount}
        />

        {/* ROW 2: ACTIVE TIMES (6 columns) & LOCATIONS (4 columns) */}
        <div className="lg:col-span-6 flex flex-col">
          <FollowerActiveTimesCard
            activeTimes={activeTimes}
          />
        </div>
        
        <div className="lg:col-span-4 flex flex-col">
          <FollowerLocationsCard
            countryData={demographics.country}
            cityData={demographics.city}
            followersCount={followersCount}
          />
        </div>

        {/* ROW 3: AGE GROUPS (5 columns) & GENDER (5 columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <FollowerAgeCard
            ageData={demographics.age}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <FollowerGenderCard
            genderDataRaw={demographics.gender}
          />
        </div>

      </div>
    </div>
  );
}
