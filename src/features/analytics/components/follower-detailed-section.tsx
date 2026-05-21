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
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-foreground/2 rounded-3xl border border-foreground/10 p-6 text-center backdrop-blur-md">
        <div className="p-4 bg-error/10 rounded-full mb-4 text-error">
          <Info size={28} />
        </div>
        <h3 className="text-foreground font-bold mb-2 text-lg">Không thể lấy dữ liệu người theo dõi</h3>
        <p className="text-foreground/40 text-sm max-w-md">
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
      {/* DEMOGRAPHICS GRID - 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD A: LOCATION TABS COUNTRY / CITY */}
        <FollowerLocationsCard
          countryData={demographics.country}
          cityData={demographics.city}
          followersCount={followersCount}
        />

        {/* CARD B: AGE GROUPS */}
        <FollowerAgeCard
          ageData={demographics.age}
        />

        {/* CARD C: GENDER DONUT PIE */}
        <FollowerGenderCard
          genderDataRaw={demographics.gender}
        />

        {/* CARD D: ACTIVE TIMES */}
        <FollowerActiveTimesCard
          activeTimes={activeTimes}
        />

      </div>
    </div>
  );
}
