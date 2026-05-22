import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, User, Globe, Clock, Target } from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

interface FollowerPersonaCardProps {
  followersCount: number;
}

export function FollowerPersonaCard({ followersCount }: FollowerPersonaCardProps) {
  // Chuẩn hóa dữ liệu 4 đỉnh để vẽ vùng hội tụ năng lượng
  const personaData = [
    { subject: 'Quốc gia (VN)', value: 80, display: '32% tại Việt Nam' },
    { subject: 'Độ tuổi (25-34)', value: 85, display: '41% từ 25-34 tuổi' },
    { subject: 'Giới tính (Nam)', value: 95, display: '71% nam giới' },
    { subject: 'Giờ vàng (9 PM)', value: 100, display: 'Online đỉnh lúc 9 PM' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md font-sans lg:col-span-10"
    >
      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        {/* LEFT SIDE: RADAR CHART */}
        <div className="w-full lg:w-[45%] flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Compass size={20} className="text-primary animate-spin-slow" />
            <h4 className="font-extrabold text-base-content text-lg tracking-tight font-brand">
              Điểm Hội Tụ Năng Lượng Khán Giả
            </h4>
          </div>
          
          <div className="w-full h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={personaData}>
                <PolarGrid stroke="var(--color-base-content)" opacity={0.08} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ 
                    fill: 'var(--color-base-content)', 
                    opacity: 0.8, 
                    fontSize: 10, 
                    fontWeight: 700,
                    fontFamily: 'var(--font-brand, sans-serif)'
                  }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Chỉ số hội tụ"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            
            {/* Center decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <Target size={40} className="text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono mt-2">
            Biểu đồ Radar liên kết 4 đỉnh hành vi & nhân khẩu học
          </p>
        </div>

        {/* RIGHT SIDE: AUDIENCE PERSONA HIGHLIGHTS */}
        <div className="w-full lg:w-[55%] flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-center gap-2 mb-3 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider font-mono">
                Chân dung Khán giả lý tưởng
              </span>
            </div>
            
            <h3 className="text-2xl font-black text-base-content tracking-tight font-brand mb-4">
              "Nam giới trẻ tuổi công sở & công nghệ, hoạt động đêm muộn"
            </h3>
            
            {/* Persona Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-base-200/50 border border-base-content/5 rounded-2xl">
                <User size={16} className="text-info mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">Giới tính & Tuổi</span>
                  <span className="text-xs font-bold text-base-content">Nam giới (71%), nhóm 25-34 (41%)</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-base-200/50 border border-base-content/5 rounded-2xl">
                <Globe size={16} className="text-success mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">Vị trí địa lý</span>
                  <span className="text-xs font-bold text-base-content">Việt Nam (32%) & Khối ASEAN (30%)</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-base-200/50 border border-base-content/5 rounded-2xl sm:col-span-2">
                <Clock size={16} className="text-secondary mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">Hành vi online</span>
                  <span className="text-xs font-bold text-base-content">Đạt đỉnh online vào 9 PM hàng ngày với hơn 6.000 người hoạt động</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Strategic Insight */}
          <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-2xl text-xs text-base-content/80 font-medium shadow-xs">
            <span className="font-extrabold text-primary flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Target size={14} /> Khuyến nghị truyền thông chiến lược
            </span>
            Kênh đang sở hữu tệp người theo dõi có độ tập trung cực kỳ cao (Nam giới, 25-34 tuổi). Hãy ưu tiên sản xuất các nội dung có chiều sâu, thực tế, công nghệ hoặc phong cách sống nam tính. Lên lịch xuất bản vào lúc <strong className="text-primary font-bold">20:45</strong> hàng ngày để đón đầu đỉnh sóng online lúc <strong className="text-primary font-bold">9 PM</strong>, giúp gia tăng tỷ lệ tiếp cận tự nhiên gấp 2.5 lần.
          </div>
        </div>

      </div>
    </motion.div>
  );
}
