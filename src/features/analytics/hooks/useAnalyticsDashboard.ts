/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getAnalyticsAction, syncAnalyticsAction, syncAllAccountsAction,
  getFollowerDetailedAnalyticsAction, getPostDeepAnalyticsAction
} from '@features/analytics/actions/analytics.actions';
import { AnalyticsPeriodData, AnalyticsRange } from '@features/analytics/types';
import { calcSummary, fillDateGaps, getXAxisFormatter } from '@shared/lib/analytics-utils';
import { AlertTriangle, Star, Flame } from 'lucide-react';

interface UseAnalyticsDashboardProps {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
}

function getStaleTime(range: AnalyticsRange): number {
  switch (range) {
    case '7d': return 5 * 60 * 1000;    // 5 mins
    case '30d': return 15 * 60 * 1000;  // 15 mins
    case '90d': return 30 * 60 * 1000;  // 30 mins
    case 'custom': return 30 * 60 * 1000; // 30 mins
    default: return 5 * 60 * 1000;
  }
}

export function useAnalyticsDashboard({ initialData, accounts }: UseAnalyticsDashboardProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'content'>('general');
  const [activeChart, setActiveChart] = useState<'reach-engagement' | 'views-interactions' | 'followers'>('reach-engagement');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const cStart = range === 'custom' && customStart ? new Date(customStart) : undefined;
  const cEnd = range === 'custom' && customEnd ? new Date(customEnd) : undefined;

  const isInitialState = selectedAccountId === accounts[0]?.id && range === '30d';

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['analytics', selectedAccountId, range, cStart, cEnd],
    queryFn: () => getAnalyticsAction(selectedAccountId, range, cStart, cEnd),
    initialData: isInitialState && initialData ? { data: initialData, error: null } : undefined,
    staleTime: getStaleTime(range),
  });

  const isInstagram = accounts.find(a => a.id === selectedAccountId)?.platform === 'instagram';

  const { data: followerDetailsResult } = useQuery({
    queryKey: ['follower-details', selectedAccountId, range, cStart, cEnd],
    queryFn: () => getFollowerDetailedAnalyticsAction(selectedAccountId, range, cStart, cEnd),
    staleTime: 5 * 60 * 1000,
    enabled: isInstagram && !!selectedAccountId,
  });

  const followerDetails = followerDetailsResult?.data;
  const isFollowerInsufficientData = followerDetails?.insufficientData ?? false;
  const followsAndUnfollows = followerDetails?.followsAndUnfollows || [];
  const totalFollows = followsAndUnfollows.reduce((sum: number, d: any) => sum + (d.follows || 0), 0);
  const totalUnfollows = followsAndUnfollows.reduce((sum: number, d: any) => sum + (d.unfollows || 0), 0);
  const netGrowth = totalFollows - totalUnfollows;

  const { data: deepAnalyticsResult, isPending: isDeepAnalyticsLoading } = useQuery({
    queryKey: ['post-deep-analytics', selectedAccountId, range, customStart, customEnd],
    queryFn: () => getPostDeepAnalyticsAction(selectedAccountId, range, cStart, cEnd),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedAccountId,
  });

  const deepAnalyticsData = deepAnalyticsResult?.data || null;

  async function handleSync() {
    if (!selectedAccountId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncAnalyticsAction(selectedAccountId);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['analytics', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-posts', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-content', selectedAccountId] });
      } else {
        console.error('Sync failed:', result.error);
        alert(`Sync failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncAll() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllAccountsAction();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['top-posts'] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown'] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency'] });
        queryClient.invalidateQueries({ queryKey: ['top-content'] });
        alert(`Đã đồng bộ thành công ${result.successful}/${result.processed} tài khoản.`);
      } else {
        console.error('Sync All failed:', result.error);
        alert(`Sync All failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync All error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  const totals = data?.data ? calcSummary(data.data) : null;
  const xAxisFormatter = getXAxisFormatter(range);
  
  const currentSnapshots = data?.data ? fillDateGaps(data.data.current, data.data.currentStart, data.data.currentEnd) : [];
  const previousSnapshots = data?.data ? fillDateGaps(data.data.previous, data.data.previousStart, data.data.previousEnd) : [];

  const chartData = currentSnapshots.map((s, i) => {
    const prev = previousSnapshots[i];
    return {
      date: xAxisFormatter(s.date),
      reach: s.reach || 0,
      engagement: s.accountsEngaged ?? s.engagement ?? 0,
      views: s.impressions || 0,
      followers: s.followers || 0,
      profileVisits: s.profileVisits || 0,
      profileLinksTaps: s.profileLinksTaps || 0,
      prevReach: prev?.reach ?? 0,
      prevEngagement: prev?.engagement ?? 0,
      prevViews: prev?.impressions ?? 0,
      prevFollowers: prev?.followers ?? 0,
    };
  });

  const latestWithActiveTimes = [...(data?.data?.current || [])].reverse().find(s => s.activeTimes);
  
  let followersPct = data?.data?.followersPct ?? 0;
  let nonfollowersPct = data?.data?.nonfollowersPct ?? 0;

  if (followersPct === 0 && nonfollowersPct === 0) {
    const currentSnapshotsWithFollowers = (data?.data?.current || []).filter(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined &&
           s.nonfollowersPct !== null && s.nonfollowersPct !== undefined
    );

    if (currentSnapshotsWithFollowers.length > 0) {
      let totalReachWeight = 0;
      let sumFollowersPct = 0;
      let sumNonfollowersPct = 0;

      currentSnapshotsWithFollowers.forEach((s: any) => {
        const dailyReach = s.reach || s.accountsReached || 0;
        const weight = dailyReach > 0 ? dailyReach : 1;

        totalReachWeight += weight;
        sumFollowersPct += (s.followersPct || 0) * weight;
        sumNonfollowersPct += (s.nonfollowersPct || 0) * weight;
      });

      if (totalReachWeight > 0) {
        followersPct = Math.round(sumFollowersPct / totalReachWeight);
        nonfollowersPct = Math.round(sumNonfollowersPct / totalReachWeight);

        const pctSum = followersPct + nonfollowersPct;
        if (pctSum > 0) {
          followersPct = Math.round((followersPct / pctSum) * 100);
          nonfollowersPct = 100 - followersPct;
        }
      }
    } else {
      const latestWithAdvanced = [...(data?.data?.current || [])].reverse().find((s: any) => s.followersPct !== null && s.followersPct !== undefined);
      followersPct = latestWithAdvanced?.followersPct || 0;
      nonfollowersPct = latestWithAdvanced?.nonfollowersPct || 0;
    }
  }

  const currentSnapshotsWithViewsBreakdown = (data?.data?.current || []).filter(
    (s: any) => s.byContentViews && (
      (s.byContentViews.all && (s.byContentViews.all.posts > 0 || s.byContentViews.all.reels > 0 || s.byContentViews.all.stories > 0)) ||
      (s.byContentViews.followers && (s.byContentViews.followers.posts > 0 || s.byContentViews.followers.reels > 0 || s.byContentViews.followers.stories > 0))
    )
  );

  let aggregatedByContentViews: any = null;

  if (currentSnapshotsWithViewsBreakdown.length > 0) {
    let totalViewsWeight = 0;
    const temp = {
      all: { posts: 0, reels: 0, stories: 0 },
      followers: { posts: 0, reels: 0, stories: 0 },
      nonfollowers: { posts: 0, reels: 0, stories: 0 }
    };

    currentSnapshotsWithViewsBreakdown.forEach((s: any) => {
      const dailyViews = s.impressions || s.reach || 0;
      const weight = dailyViews > 0 ? dailyViews : 1;

      totalViewsWeight += weight;
      const v = s.byContentViews!;

      temp.all.posts += (v.all?.posts || 0) * weight;
      temp.all.reels += (v.all?.reels || 0) * weight;
      temp.all.stories += (v.all?.stories || 0) * weight;

      temp.followers.posts += (v.followers?.posts || 0) * weight;
      temp.followers.reels += (v.followers?.reels || 0) * weight;
      temp.followers.stories += (v.followers?.stories || 0) * weight;

      temp.nonfollowers.posts += (v.nonfollowers?.posts || 0) * weight;
      temp.nonfollowers.reels += (v.nonfollowers?.reels || 0) * weight;
      temp.nonfollowers.stories += (v.nonfollowers?.stories || 0) * weight;
    });

    if (totalViewsWeight > 0) {
      const getNormBreakdown = (breakdown: { posts: number; reels: number; stories: number }) => {
        const p = breakdown.posts;
        const r = breakdown.reels;
        const s = breakdown.stories;
        const total = p + r + s;
        if (total > 0) {
          const posts = Number((p / total * 100).toFixed(1));
          const reels = Number((r / total * 100).toFixed(1));
          const stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
          return { posts, reels, stories };
        }
        return { posts: 0, reels: 0, stories: 0 };
      };

      aggregatedByContentViews = {
        all: getNormBreakdown(temp.all),
        followers: getNormBreakdown(temp.followers),
        nonfollowers: getNormBreakdown(temp.nonfollowers)
      };
    }
  }

  const fallbackViewsBreakdown = data?.data?.currentPostTotals?.byContentViews;

  const viewsData = {
    totalViews: totals?.impressions?.value || 0,
    followersPct,
    nonfollowersPct,
    accountsReached: totals?.reach?.value || 0,
    byContentViews: aggregatedByContentViews 
      ? aggregatedByContentViews 
      : (fallbackViewsBreakdown ? {
          all: fallbackViewsBreakdown,
          followers: fallbackViewsBreakdown,
          nonfollowers: fallbackViewsBreakdown
        } : null),
  };

  const currentSnapshotsWithInteractions = (data?.data?.current || []).filter(
    (s: any) => s.byContentInteractions && (
      s.byContentInteractions.posts > 0 || 
      s.byContentInteractions.reels > 0 || 
      s.byContentInteractions.stories > 0
    )
  );

  let aggregatedByContentInteractions: any = null;

  if (currentSnapshotsWithInteractions.length > 0) {
    let totalEngWeight = 0;
    const temp = { posts: 0, reels: 0, stories: 0 };

    currentSnapshotsWithInteractions.forEach((s: any) => {
      const dailyEngagement = s.engagement || 0;
      const weight = dailyEngagement > 0 ? dailyEngagement : 1;

      totalEngWeight += weight;
      const v = s.byContentInteractions!;

      temp.posts += (v.posts || 0) * weight;
      temp.reels += (v.reels || 0) * weight;
      temp.stories += (v.stories || 0) * weight;
    });

    if (totalEngWeight > 0) {
      const p = temp.posts;
      const r = temp.reels;
      const s = temp.stories;
      const total = p + r + s;
      if (total > 0) {
        const posts = Number((p / total * 100).toFixed(1));
        const reels = Number((r / total * 100).toFixed(1));
        const stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
        aggregatedByContentInteractions = { posts, reels, stories };
      }
    }
  }

  const totalAccEngaged = (data?.data?.current || []).reduce((acc: number, curr: any) => acc + (curr.accountsEngaged || 0), 0);

  const interactionsData = {
    totalInteractions: data?.data?.uniqueInteractions ?? (totals?.engagement?.value || 0),
    accountsEngaged: data?.data?.uniqueAccountsEngaged ?? (totalAccEngaged > 0 ? totalAccEngaged : (totals?.engagement?.value || 0)),
    byContentInteractions: aggregatedByContentInteractions
      ? aggregatedByContentInteractions
      : (data?.data?.currentPostTotals?.byContentInteractions || null),
  };

  const totalReach = chartData.reduce((sum, item) => sum + item.reach, 0);
  const totalEngagement = chartData.reduce((sum, item) => sum + item.engagement, 0);
  const avgReach = chartData.length > 0 ? Math.round(totalReach / chartData.length) : 0;
  const avgEngagement = Math.round(totalEngagement / chartData.length);
  const avgEngagementRate = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(2)) : 0;

  const getEngagementInsight = (rate: number) => {
    if (rate === 0) return null;
    if (rate < 5) {
      return {
        type: 'low',
        icon: AlertTriangle,
        color: 'text-warning bg-warning/10 border-warning/20',
        title: 'Khoảng cách rộng (Tương tác thấp)',
        desc: 'Số lượng tài khoản tiếp cận cao nhưng tương tác lại thấp. Điều này cho thấy nội dung của bạn chưa đủ sức hút để người xem hành động. Hãy thử thiết kế thumbnail nổi bật hơn, tối ưu 3 giây đầu của video hoặc chèn câu hỏi mở (CTA) hấp dẫn để kêu gọi bình luận.',
      };
    } else if (rate >= 5 && rate < 15) {
      return {
        type: 'good',
        icon: Star,
        color: 'text-info bg-info/10 border-info/20',
        title: 'Khoảng cách ổn định (Tương tác khá)',
        desc: 'Tỷ lệ tương tác trên lượt tiếp cận đang hoạt động ổn định. Nội dung của bạn đi đúng hướng và có sức hút nhất định. Hãy tiếp tục tối ưu hóa khung giờ đăng bài và giữ vững phong cách chia sẻ hữu ích hiện tại.',
      };
    } else {
      return {
        type: 'excellent',
        icon: Flame,
        color: 'text-success bg-success/10 border-success/20',
        title: 'Khoảng cách hẹp (Tương tác xuất sắc!)',
        desc: 'Hiệu suất tuyệt vời! Tỷ lệ tương tác trên mỗi lượt tiếp cận đạt mức rất cao. Khán giả cực kỳ hứng thú và có sự gắn kết sâu sắc với nội dung của bạn. Đây là công thức thành công, hãy nhân bản định dạng và chủ đề này ngay lập tức!',
      };
    }
  };
  const engagementInsight = getEngagementInsight(avgEngagementRate);

  const totalViews = chartData.reduce((sum, item) => sum + item.views, 0);
  const avgViews = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;
  const avgInteractions = Math.round(totalEngagement / chartData.length);
  const avgInteractionRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

  const getInteractionInsight = (rate: number) => {
    if (rate === 0) return null;
    if (rate < 2) {
      return {
        type: 'low',
        icon: AlertTriangle,
        color: 'text-warning bg-warning/10 border-warning/20',
        title: 'Hiệu suất chuyển đổi tương tác thấp',
        desc: 'Nội dung của bạn nhận được nhiều lượt xem nhưng tỷ lệ người thực hiện hành động tương tác (Like, Comment, Share, Save) khá thấp. Bạn nên thử đặt các câu hỏi kích thích thảo luận dưới caption, tạo minigame hoặc chèn lời kêu gọi hành động (CTA) trực tiếp trên hình ảnh/video để thúc đẩy người dùng tương tác.',
      };
    } else if (rate >= 2 && rate < 6) {
      return {
        type: 'good',
        icon: Star,
        color: 'text-info bg-info/10 border-info/20',
        title: 'Tỷ lệ tương tác ổn định',
        desc: 'Khả năng chuyển đổi từ lượt xem sang tương tác đạt mức ổn định so với trung bình. Khán giả phản hồi tương đối tích cực với các nội dung hiển thị. Hãy tiếp tục tối ưu hóa chất lượng hình ảnh, duy trì đều đặn tần suất đăng để củng cố thói quen tương tác của fan.',
      };
    } else {
      return {
        type: 'excellent',
        icon: Flame,
        color: 'text-success bg-success/10 border-success/20',
        title: 'Hiệu suất tương tác cực kỳ xuất sắc!',
        desc: 'Tỷ lệ chuyển đổi tương tác trên mỗi lượt xem đạt mức rất cao! Khán giả cực kỳ hứng thú và không ngần ngại tương tác với các bài viết của bạn. Đây là những nội dung có giá trị giữ chân và tạo sự kết nối cộng đồng mạnh mẽ. Bạn nên ưu tiên phát triển thêm nhiều nội dung theo chủ đề này.',
      };
    }
  };
  const interactionInsight = getInteractionInsight(avgInteractionRate);

  const needsReauth = accounts.find(a => a.id === selectedAccountId && (a as any).needs_reauth) || data?.data?.needsReauth;

  return {
    selectedAccountId,
    setSelectedAccountId,
    range,
    setRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    cStart,
    cEnd,
    activeTab,
    setActiveTab,
    activeChart,
    setActiveChart,
    isSyncing,
    selectedPostForDetail,
    setSelectedPostForDetail,
    isPending,
    isError,
    isFetching,
    isInstagram,
    followerDetails,
    isFollowerInsufficientData,
    followsAndUnfollows,
    totalFollows,
    totalUnfollows,
    netGrowth,
    deepAnalyticsData,
    isDeepAnalyticsLoading,
    totals,
    chartData,
    viewsData,
    interactionsData,
    avgReach,
    avgEngagement,
    avgEngagementRate,
    engagementInsight,
    avgViews,
    avgInteractions,
    avgInteractionRate,
    interactionInsight,
    latestWithActiveTimes,
    needsReauth,
    data,
    handleSync,
    handleSyncAll,
  };
}
