import * as React from "react";
import { AccountAvatar } from "@shared/ui";
import { cn } from "@shared/lib";

interface ProfileSectionProps {
  persona: {
    name: string;
    gender: string;
    age: number;
  };
  account: any;
  onChange: (updates: any) => void;
}

export function ProfileSection({
  persona,
  account,
  onChange,
}: ProfileSectionProps) {
  const meta = (account?.metadata || {}) as any;
  const accountAvatarUrl =
    meta?.avatar_url ||
    meta?.profile_picture_url ||
    meta?.picture?.data?.url ||
    undefined;
  const platformLower = (account?.platform || "facebook").toLowerCase();
  const platformBorderColor =
    platformLower === "instagram"
      ? "border-instagram-gradient"
      : platformLower === "facebook"
        ? "border-facebook"
        : platformLower === "tiktok"
          ? "border-tiktok"
          : "border-base-content/10";

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Avatar của tài khoản */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <AccountAvatar
          avatarUrl={accountAvatarUrl}
          name={account?.platform_user_name || "Account"}
          platform={account?.platform || "facebook"}
          size={20}
          showPlatformIcon={false}
          avatarClassName={cn("border-2", platformBorderColor)}
        />
      </div>

      {/* Core Info Inputs */}
      <div className="flex-1 w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-base-content/60">
            Tên Persona (Nhân viên ảo)
          </label>
          <input
            type="text"
            value={persona.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
            placeholder="VD: Trợ lý Mai, Em, v.v."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-base-content/60">Giới tính</label>
            <select
              value={persona.gender || "female"}
              onChange={(e) => onChange({ gender: e.target.value })}
              className="select select-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all"
            >
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="neutral">Phi giới tính</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-base-content/60">Độ tuổi</label>
            <input
              type="number"
              value={persona.age || ""}
              onChange={(e) =>
                onChange({ age: parseInt(e.target.value) || 20 })
              }
              className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all"
              placeholder="VD: 22"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
