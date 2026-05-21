import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';

interface FollowerInsufficientDataStateProps {
  followersCount: number;
  username?: string;
}

export function FollowerInsufficientDataState({
  followersCount,
  username
}: FollowerInsufficientDataStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-base-200 border border-foreground/10 rounded-3xl p-8 text-center font-sans shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-tr from-warning/5 via-transparent to-orange-500/5 pointer-events-none" />
      <div className="w-16 h-16 bg-warning/10 border border-warning/20 text-warning rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-warning/5">
        <Users size={28} className="animate-pulse" />
      </div>
      <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">Dữ liệu Người theo dõi hạn chế</h3>
      <p className="text-foreground/60 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
        Meta chỉ cung cấp thông tin chi tiết về nhân khẩu học và biến động người theo dõi cho các tài khoản Instagram có từ <span className="text-warning font-bold">100 người theo dõi trở lên</span>.
      </p>
      
      <div className="inline-flex flex-col items-center justify-center p-6 bg-foreground/2 border border-foreground/10 rounded-2xl mb-6 min-w-[200px]">
        <span className="text-xs text-foreground/40 uppercase tracking-widest font-bold mb-1">Followers hiện tại</span>
        <span className="text-4xl font-black text-foreground">{followersCount.toLocaleString()}</span>
        {username && <span className="text-xs text-warning/70 font-semibold mt-1">@{username}</span>}
      </div>

      <div className="p-4 bg-warning/5 border border-warning/10 rounded-2xl max-w-md mx-auto flex items-start gap-3 text-left">
        <Sparkles size={16} className="text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-foreground/70 leading-relaxed">
          Hãy tiếp tục chia sẻ các nội dung thu hút, sử dụng Reels và đăng bài đều đặn để phát triển kênh của bạn lên mốc 100 followers nhé!
        </p>
      </div>
    </motion.div>
  );
}
