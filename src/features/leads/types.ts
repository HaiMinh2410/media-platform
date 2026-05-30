export interface Lead {
  id: string;
  name: string;
  avatar: string | null;
  stage: string;
  source: string;
  platform: string;
  date: string;
  fullDate?: string;
  tags?: string[];
  unread?: boolean;
  accountId?: string;
  createdAt?: string | Date;
  convertedAt?: string | Date | null;
}

export interface LeadStage {
  id: string;
  label: string;
  count: number;
  icon: string;
  color: string;
}
