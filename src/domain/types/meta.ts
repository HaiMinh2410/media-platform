export type MetaTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
};

export type MetaUserProfile = {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
};

export type MetaDebugTokenData = {
  data: {
    app_id: string;
    type: string;
    application: string;
    expires_at: number;
    is_valid: boolean;
    scopes: string[];
    user_id: string;
  }
};

export type MetaApiResponse<T> = {
  data: T | null;
  error: string | null;
  details?: any; // For debugging internal Meta errors
};

export type MetaInsightValue = {
  value: any; // Can be number or Record<string, number> for breakdowns
  end_time: string;
};

export type MetaInsightItem = {
  name: string;
  period: string;
  values: MetaInsightValue[];
  title?: string;
  description?: string;
  id?: string;
};

export type MetaInsightsResponse = {
  data: MetaInsightItem[];
};

export type MetaPageFansResponse = {
  fan_count: number;
  id: string;
};

export type MetaIGFollowersResponse = {
  followers_count: number;
  id: string;
};

export type MetaPublishResponse = {
  id: string;
};

export type MetaMediaContainerResponse = {
  id: string;
};

export type MetaMediaResponse = {
  data: {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
    caption?: string;
    media_url?: string;
    thumbnail_url?: string;
    children?: {
      data: {
        media_url: string;
        media_type: string;
      }[];
    };
    like_count: number;
    comments_count: number;
    timestamp: string;
  }[];
};

export type MetaMediaInsightsResponse = {
  data: {
    name: string;
    values: { value: number }[];
  }[];
};
