/**
 * Helper to parse a double breakdown (e.g. media_product_type, follow_type) from Meta insights.
 * Handles both the nested breakdowns structure and direct flat values.
 */
export function parseDoubleBreakdown(insightsData: any[], metricName: string) {
  if (!insightsData || !Array.isArray(insightsData)) {
    return null;
  }
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return null;
  }
  
  const valueObj = (metricItem.values && metricItem.values[0]) || metricItem.total_value || metricItem;
  if (!valueObj) {
    return null;
  }
  
  const counts = {
    all: { posts: 0, reels: 0, stories: 0 },
    followers: { posts: 0, reels: 0, stories: 0 },
    nonfollowers: { posts: 0, reels: 0, stories: 0 }
  };
  
  // 1. Array-based nested breakdowns structure (standard modern format)
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const mediaIdx = keys.indexOf('media_product_type');
      const followIdx = keys.indexOf('follow_type');
      
      if (mediaIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const rawMedia = vals[mediaIdx] || '';
          
          let category: 'posts' | 'reels' | 'stories' | null = null;
          if (rawMedia === 'POST' || rawMedia === 'FEED' || rawMedia === 'AD' || rawMedia === 'CAROUSEL_CONTAINER' || rawMedia === 'CAROUSEL_ALBUM') {
            category = 'posts';
          } else if (rawMedia === 'REELS' || rawMedia === 'REEL' || rawMedia === 'VIDEO') {
            category = 'reels';
          } else if (rawMedia === 'STORY' || rawMedia === 'STORIES') {
            category = 'stories';
          }
          
          if (!category) continue;
          
          const val = res.value || 0;
          
          if (followIdx !== -1) {
            const rawFollow = vals[followIdx] || '';
            if (rawFollow === 'FOLLOWER') {
              counts.followers[category] += val;
            } else if (rawFollow === 'NON_FOLLOWER') {
              counts.nonfollowers[category] += val;
            }
          }
          
          counts.all[category] += val;
        }
      }
    }
    return counts;
  }
  
  // 2. Simple object structure where key is the media type (fallback for single breakdowns)
  const val = valueObj.value;
  if (val && typeof val === 'object') {
    for (const [rawKey, innerVal] of Object.entries(val)) {
      let category: 'posts' | 'reels' | 'stories' | null = null;
      if (rawKey === 'POST' || rawKey === 'FEED' || rawKey === 'AD' || rawKey === 'CAROUSEL_CONTAINER' || rawKey === 'CAROUSEL_ALBUM') {
        category = 'posts';
      } else if (rawKey === 'REELS' || rawKey === 'REEL' || rawKey === 'VIDEO') {
        category = 'reels';
      } else if (rawKey === 'STORY' || rawKey === 'STORIES') {
        category = 'stories';
      }
      
      if (!category) continue;
      
      if (typeof innerVal === 'number') {
        counts.all[category] += innerVal;
      } else if (innerVal && typeof innerVal === 'object') {
        const followerVal = (innerVal as any).FOLLOWER || (innerVal as any).follower || 0;
        const nonFollowerVal = (innerVal as any).NON_FOLLOWER || (innerVal as any)['non-follower'] || (innerVal as any).non_follower || 0;
        
        counts.followers[category] += followerVal;
        counts.nonfollowers[category] += nonFollowerVal;
        counts.all[category] += followerVal + nonFollowerVal;
      }
    }
    return counts;
  }
  
  return null;
}

/**
 * Helper to parse a single dimension breakdown for follow_type from Meta insights.
 */
export function parseFollowType(insightsData: any[], metricName: string) {
  if (!insightsData || !Array.isArray(insightsData)) {
    return { follower: 0, nonFollower: 0 };
  }
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return { follower: 0, nonFollower: 0 };
  }
  
  const valueObj = metricItem.total_value || (metricItem.values && metricItem.values[0]) || metricItem;
  if (!valueObj) {
    return { follower: 0, nonFollower: 0 };
  }
  
  let follower = 0;
  let nonFollower = 0;
  
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const followIdx = keys.indexOf('follow_type');
      
      if (followIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const val = res.value || 0;
          const rawFollow = (vals[followIdx] || '').toUpperCase().replace('-', '_');
          
          if (rawFollow === 'FOLLOWER') {
            follower += val;
          } else if (rawFollow === 'NON_FOLLOWER') {
            nonFollower += val;
          }
        }
      }
    }
  } else if (valueObj.value && typeof valueObj.value === 'object') {
    const val = valueObj.value;
    follower = val.FOLLOWER || val.follower || 0;
    nonFollower = val.NON_FOLLOWER || val['non-follower'] || val.non_follower || 0;
  }
  
  return { follower, nonFollower };
}

/**
 * Helper to parse a single dimension breakdown for media_product_type from Meta insights.
 */
export function parseMediaProductType(insightsData: any[], metricName: string) {
  if (!insightsData || !Array.isArray(insightsData)) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  
  const valueObj = metricItem.total_value || (metricItem.values && metricItem.values[0]) || metricItem;
  if (!valueObj) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  
  let posts = 0;
  let reels = 0;
  let stories = 0;
  
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const mediaIdx = keys.indexOf('media_product_type');
      
      if (mediaIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const val = res.value || 0;
          const rawMedia = (vals[mediaIdx] || '').toUpperCase().replace('-', '_');
          
          if (rawMedia === 'POST' || rawMedia === 'FEED' || rawMedia === 'AD' || rawMedia === 'CAROUSEL_CONTAINER' || rawMedia === 'CAROUSEL_ALBUM') {
            posts += val;
          } else if (rawMedia === 'REELS' || rawMedia === 'REEL' || rawMedia === 'VIDEO') {
            reels += val;
          } else if (rawMedia === 'STORY' || rawMedia === 'STORIES') {
            stories += val;
          }
        }
      }
    }
  } else if (valueObj.value && typeof valueObj.value === 'object') {
    for (const [rawKey, val] of Object.entries(valueObj.value)) {
      if (typeof val !== 'number') continue;
      const normalizedKey = rawKey.toUpperCase().replace('-', '_');
      if (normalizedKey === 'POST' || normalizedKey === 'FEED' || normalizedKey === 'AD' || normalizedKey === 'CAROUSEL_CONTAINER' || normalizedKey === 'CAROUSEL_ALBUM') {
        posts += val;
      } else if (normalizedKey === 'REELS' || normalizedKey === 'REEL' || normalizedKey === 'VIDEO') {
        reels += val;
      } else if (normalizedKey === 'STORY' || normalizedKey === 'STORIES') {
        stories += val;
      }
    }
  }
  
  return { posts, reels, stories };
}

/**
 * Aggregates daily hourly online_followers data into the 7 days of the week, each with 8 three-hour blocks
 * expected by the active-times-chart component.
 */
export function aggregateActiveTimes(values: Array<{ value: Record<string, number>; end_time: string }>): Record<string, number[]> {
  const result: Record<string, number[]> = {
    "M": [0, 0, 0, 0, 0, 0, 0, 0],
    "Tu": [0, 0, 0, 0, 0, 0, 0, 0],
    "W": [0, 0, 0, 0, 0, 0, 0, 0],
    "Th": [0, 0, 0, 0, 0, 0, 0, 0],
    "F": [0, 0, 0, 0, 0, 0, 0, 0],
    "Sa": [0, 0, 0, 0, 0, 0, 0, 0],
    "Su": [0, 0, 0, 0, 0, 0, 0, 0]
  };

  const counts: Record<string, number[]> = {
    "M": [0, 0, 0, 0, 0, 0, 0, 0],
    "Tu": [0, 0, 0, 0, 0, 0, 0, 0],
    "W": [0, 0, 0, 0, 0, 0, 0, 0],
    "Th": [0, 0, 0, 0, 0, 0, 0, 0],
    "F": [0, 0, 0, 0, 0, 0, 0, 0],
    "Sa": [0, 0, 0, 0, 0, 0, 0, 0],
    "Su": [0, 0, 0, 0, 0, 0, 0, 0]
  };

  const JS_DAY_TO_LABEL = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

  for (const item of values) {
    if (!item.value || typeof item.value !== 'object' || Object.keys(item.value).length === 0) continue;
    const date = new Date(item.end_time);
    
    // Shift by 7 hours to align with Meta Pacific Time (UTC-7) calculation
    const pacTime = new Date(date.getTime() - 7 * 60 * 60 * 1000);
    const dayOfWeek = pacTime.getUTCDay();
    const dayLabel = JS_DAY_TO_LABEL[dayOfWeek];

    for (let i = 0; i < 8; i++) {
      const h0 = String(i * 3);
      const h1 = String(i * 3 + 1);
      const h2 = String(i * 3 + 2);
      
      const v0 = item.value[h0] ?? 0;
      const v1 = item.value[h1] ?? 0;
      const v2 = item.value[h2] ?? 0;
      
      const avgVal = (v0 + v1 + v2) / 3;
      
      result[dayLabel][i] += avgVal;
      counts[dayLabel][i] += 1;
    }
  }

  for (const day of Object.keys(result)) {
    for (let i = 0; i < 8; i++) {
      const count = counts[day][i];
      if (count > 0) {
        result[day][i] = Math.round(result[day][i] / count);
      } else {
        result[day][i] = 0;
      }
    }
  }

  return result;
}
