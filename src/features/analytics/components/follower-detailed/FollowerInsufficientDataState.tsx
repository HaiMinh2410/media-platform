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
      className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-8 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-tr from-warning/5 via-transparent to-orange-500/5 pointer-events-none" />
      <div className="w-16 h-16 bg-warning/10 border border-warning/20 text-warning rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-warning/5">
        <Users size={28} className="animate-pulse" />
      </div>
      <h3 className="text-xl font-extrabold text-base-content mb-2 tracking-tight">Dữ liệu Người theo dõi hạn chế</h3>
      <p className="text-base-content/70 text-sm max-w-lg mx-auto mb-6 leading-relaxed font-medium">
        Meta chỉ cung cấp thông tin chi tiết về nhân khẩu học và biến động người theo dõi cho các tài khoản Instagram có từ <span className="text-warning font-black font-mono">100 người theo dõi trở lên</span>.
      </p>
      
      <div className="inline-flex flex-col items-center justify-center p-6 bg-base-200/50 border border-base-content/5 rounded-2xl mb-6 min-w-[200px] shadow-xs">
        <span className="text-xs text-base-content/40 uppercase tracking-widest font-bold mb-1">Followers hiện tại</span>
        <span className="text-4xl font-black text-base-content font-mono">{followersCount.toLocaleString()}</span>
        {username && <span className="text-xs text-warning/70 font-bold mt-1 font-mono">@{username}</span>}
      </div>

      <div className="p-4 bg-warning/5 border border-warning/10 rounded-2xl max-w-md mx-auto flex items-start gap-3 text-left shadow-2xs">
        <Sparkles size={16} className="text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-base-content/70 leading-relaxed font-medium">
          Hãy tiếp tục chia sẻ các nội dung thu hút, sử dụng Reels và đăng bài đều đặn để phát triển kênh của bạn lên mốc 100 followers nhé!
        </p>
      </div>
    </motion.div>
  );
}
