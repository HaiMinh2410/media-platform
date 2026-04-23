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
  value: number;
  end_time: string;
};

export type MetaInsightItem = {
  name: string;
  period: string;
  values: MetaInsightValue[];
  title: string;
  description: string;
  id: string;
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
