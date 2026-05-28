export interface Lead {
  id: string;
  name: string;
  avatar: string | null;
  stage: string;
  source: string;
  platform: string;
  date: string;
  unread?: boolean;
}

export interface LeadStage {
  id: string;
  label: string;
  count: number;
  icon: string;
  color: string;
}
