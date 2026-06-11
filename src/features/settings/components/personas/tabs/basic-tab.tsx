import { ProfileSection } from "./components/profile-section";
import { IdentitySection } from "./components/identity-section";
import { CommunicationSection } from "./components/communication-section";

interface BasicTabProps {
  persona: {
    name: string;
    gender: string;
    age: number;
    personality: string;
    tone: string;
    signature_emojis: string[];
    avatar_url?: string;
    settings?: {
      delay_min?: number;
      delay_max?: number;
      link_rate_limit?: number;
      blacklist_keywords?: string[];
      response_length?: "short" | "medium" | "detailed";
    };
  };
  account: any;
  onChange: (updates: any) => void;
}

export function BasicTab({ persona, account, onChange }: BasicTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Khối 1: Hồ sơ */}
      <ProfileSection persona={persona} account={account} onChange={onChange} />

      {/* Khối 2: Hồn cốt */}
      <IdentitySection persona={persona} onChange={onChange} />

      {/* Khối 3: Giao tiếp */}
      <CommunicationSection persona={persona} onChange={onChange} />
    </div>
  );
}
