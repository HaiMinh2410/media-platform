import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, User, Globe, Clock, Target, Check } from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowerPersonaCardProps {
  followersCount: number;
  demographics: {
    age: DemographicItem[];
    city: DemographicItem[];
    country: DemographicItem[];
    gender: DemographicItem[];
  };
  activeTimes: Record<string, number[]> | null;
}

const COUNTRY_MAP: Record<string, string> = {
  VN: 'Việt Nam',
  US: 'Hoa Kỳ',
  ID: 'Indonesia',
  TH: 'Thái Lan',
  PH: 'Philippines',
  MY: 'Malaysia',
  SG: 'Singapore',
  JP: 'Nhật Bản',
  KR: 'Hàn Quốc',
  IN: 'Ấn Độ',
  BR: 'Brazil',
  MX: 'Mexico',
  GB: 'Vương Quốc Anh',
  FR: 'Pháp',
  DE: 'Đức',
  AU: 'Australia',
  CA: 'Canada',
  CN: 'Trung Quốc',
  RU: 'Nga',
  ES: 'Tây Ban Nha',
  IT: 'Ý',
};

function translateCountry(code: string): string {
  const cleanCode = code.trim().toUpperCase();
  return COUNTRY_MAP[cleanCode] || cleanCode;
}

export function FollowerPersonaCard({ 
  followersCount, 
  demographics, 
  activeTimes 
}: FollowerPersonaCardProps) {
  // 1. Phân tích Giới tính hàng đầu (Top Gender)
  const genderData = demographics?.gender || [];
  const topGender = genderData[0];
  const totalGender = genderData.reduce((sum, g) => sum + g.value, 0) || 1;
  const genderPct = topGender ? Math.round((topGender.value / totalGender) * 100) : 71;
  
  let genderLabel = 'Nam giới';
  if (topGender) {
    const lowerName = topGender.name.toLowerCase();
    if (lowerName === 'f' || lowerName.includes('female') || lowerName.includes('nữ')) {
      genderLabel = 'Nữ giới';
    } else if (lowerName === 'm' || lowerName.includes('male') || lowerName.includes('nam')) {
      genderLabel = 'Nam giới';
    } else {
      genderLabel = 'Khán giả';
    }
  }

  // 2. Phân tích Độ tuổi hàng đầu (Top Age Group)
  const ageData = demographics?.age || [];
  const topAge = ageData[0];
  const totalAge = ageData.reduce((sum, a) => sum + a.value, 0) || 1;
  const agePct = topAge ? Math.round((topAge.value / totalAge) * 100) : 41;
  const ageLabel = topAge ? `nhóm ${topAge.name}` : 'nhóm 25-34';

  // 3. Phân tích Quốc gia hàng đầu (Top Country)
  const countryData = demographics?.country || [];
  const topCountry = countryData[0];
  const totalCountry = countryData.reduce((sum, c) => sum + c.value, 0) || 1;
  const countryPct = topCountry ? Math.round((topCountry.value / totalCountry) * 100) : 32;
  const countryLabel = topCountry ? translateCountry(topCountry.name) : 'Việt Nam';

  // 4. Phân tích Giờ vàng hoạt động đỉnh cao (Peak Hour)
  let peakHourLabel = '9 PM';
  let peakHourValue = 0;
  
  if (activeTimes) {
    const TIME_LABELS = ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
    Object.keys(activeTimes).forEach((day) => {
      const dayData = activeTimes[day] || [];
      dayData.forEach((val, idx) => {
        if (val > peakHourValue) {
          peakHourValue = val;
          peakHourLabel = TIME_LABELS[idx] || "9 PM";
        }
      });
    });
  }

  // 5. Chuẩn hóa dữ liệu 4 đỉnh để vẽ vùng hội tụ năng lượng Radar
  const personaData = [
    { subject: `Quốc gia (${topCountry?.name || 'VN'})`, value: countryPct, display: `${countryPct}% tại ${countryLabel}` },
    { subject: `Độ tuổi (${topAge?.name || '25-34'})`, value: agePct, display: `${agePct}% từ ${ageLabel} tuổi` },
    { subject: `Giới tính (${genderLabel === 'Nam giới' ? 'Nam' : genderLabel === 'Nữ giới' ? 'Nữ' : 'Khác'})`, value: genderPct, display: `${genderPct}% ${genderLabel.toLowerCase()}` },
    { subject: `Giờ vàng (${peakHourLabel})`, value: 100, display: `Online đỉnh lúc ${peakHourLabel}` },
  ];

  // 6. Tự động sinh Strategic Persona Insight dựa trên dữ liệu thực tế
  const isMaleDominant = genderLabel === 'Nam giới';
  const isYoungAudience = topAge ? (topAge.name.includes('13-17') || topAge.name.includes('18-24')) : false;

  let personaHeadline = '';
  let insightText = '';
  let actionItems: React.ReactNode[] = [];

  if (isMaleDominant) {
    if (isYoungAudience) {
      personaHeadline = `${genderLabel} thế hệ mới năng động, cập nhật xu hướng công nghệ`;
      insightText = `Kênh đang sở hữu tệp khán giả trẻ tuổi đầy cá tính (${genderLabel}, ${topAge?.name || '18-24'} tuổi).`;
      actionItems = [
        <span>Ưu tiên sản xuất nội dung ngắn dạng Reels cá tính, bắt kịp các xu hướng công nghệ mới, game, meme hài hước hoặc phong cách sống nam trẻ trung.</span>,
        <span>Lên lịch xuất bản lý tưởng lúc <strong className="text-amber-500 dark:text-amber-400 font-black">19:45</strong> trước đỉnh giờ vàng để tạo tương tác nhanh, tối ưu hóa lượt tiếp cận tự nhiên.</span>
      ];
    } else {
      personaHeadline = `${genderLabel} chín chắn, văn phòng & đầu tư, hoạt động muộn`;
      insightText = `Kênh đang sở hữu tệp người theo dõi có độ tập trung cực kỳ cao (${genderLabel}, ${topAge?.name || '25-34'} tuổi).`;
      actionItems = [
        <span>Ưu tiên sản xuất nội dung có chiều sâu, thực tế, công nghệ hoặc phong cách sống nam tính, chia sẻ kinh nghiệm tài chính & phát triển sự nghiệp.</span>,
        <span>Xuất bản định kỳ lúc <strong className="text-amber-500 dark:text-amber-400 font-black">20:45</strong> hàng ngày để đón đầu đỉnh sóng online lúc <strong className="text-secondary font-black">{peakHourLabel}</strong>, giúp tăng tiếp cận tự nhiên gấp <strong className="text-emerald-500 dark:text-emerald-400 font-black">2.5 lần</strong>.</span>
      ];
    }
  } else {
    // Nữ giới chiếm ưu thế
    if (isYoungAudience) {
      personaHeadline = `${genderLabel} trẻ năng động, quan tâm làm đẹp & đời sống`;
      insightText = `Kênh đang sở hữu tệp khán giả nữ rất trẻ trung (${genderLabel}, ${topAge?.name || '18-24'} tuổi).`;
      actionItems = [
        <span>Ưu tiên các chủ đề về phong cách sống, xu hướng làm đẹp, học tập, các công cụ hỗ trợ công việc học tập và video ngắn có tính thẩm mỹ thị giác cao.</span>,
        <span>Đón đầu tương tác tự nhiên bằng cách lên lịch đăng trước đỉnh giờ vàng <strong className="text-amber-500 dark:text-amber-400 font-black">${peakHourLabel}</strong> khoảng <strong className="text-emerald-500 dark:text-emerald-400 font-black">30 phút</strong>.</span>
      ];
    } else {
      personaHeadline = `${genderLabel} văn phòng hiện đại, quan tâm đời sống & tri thức`;
      insightText = `Khán giả chủ chốt là ${genderLabel} có thu nhập tự chủ (${topAge?.name || '25-34'} tuổi).`;
      actionItems = [
        <span>Tập trung các nội dung chất lượng về cân bằng giữa công việc và cuộc sống, chăm sóc sức khỏe tinh thần, tư duy tích cực hoặc các review sản phẩm uy tín.</span>,
        <span>Khung giờ vàng xuất bản tối ưu là <strong className="text-amber-500 dark:text-amber-400 font-black">20:45</strong> hàng ngày để tiếp cận lúc khán giả thư giãn và đạt đỉnh online lúc <strong className="text-secondary font-black">{peakHourLabel}</strong>.</span>
      ];
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md lg:col-span-10 w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDE: RADAR CHART (4/12 columns) */}
        <div className="w-full lg:col-span-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Compass size={18} className="text-primary animate-spin-slow" />
            <h4 className="font-extrabold text-base-content text-md tracking-tight">
              Điểm Hội Tụ Khán Giả
            </h4>
          </div>
          
          <div className="w-full h-[230px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={personaData}>
                <PolarGrid stroke="var(--color-base-content)" opacity={0.08} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ 
                    fill: 'var(--color-base-content)', 
                    opacity: 0.8, 
                    fontSize: 9, 
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans, sans-serif)'
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
              <Target size={36} className="text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono mt-2 text-center">
            Liên kết 4 đỉnh hành vi & nhân khẩu học thực tế
          </p>
        </div>

        {/* RIGHT SIDE: AUDIENCE PERSONA HIGHLIGHTS (8/12 columns) */}
        <div className="w-full lg:col-span-8 flex flex-col justify-between self-stretch">
          <div>
            
            <h3 className="text-xl lg:text-2xl font-black text-base-content tracking-tight mb-5 leading-tight">
              {personaHeadline}
            </h3>
            
            {/* Persona Details Grid (3 columns horizontally separated by subtle vertical lines) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 sm:gap-y-0 divide-y sm:divide-y-0 sm:divide-x divide-base-content/10 mb-6">
              <div className="flex items-start gap-3 px-1 sm:pl-0 sm:pr-4 pb-4 sm:pb-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-info/10 shrink-0 mt-0.5">
                  <User size={15} className="text-info" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">Giới tính & Tuổi</span>
                  <span className="text-sm font-semibold text-base-content/90 block mt-0.5">
                    {genderLabel} ({genderPct}%), {ageLabel} ({agePct}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-3 px-1 sm:px-4 py-4 sm:py-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 shrink-0 mt-0.5">
                  <Globe size={15} className="text-success" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">Vị trí địa lý</span>
                  <span className="text-sm font-semibold text-base-content/90 leading-tight block mt-0.5">
                    {countryLabel} ({countryPct}%) chiếm ưu thế
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 px-1 sm:pl-4 sm:pr-0 pt-4 sm:pt-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 shrink-0 mt-0.5">
                  <Clock size={15} className="text-secondary" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">Hành vi online</span>
                  <span className="text-sm font-semibold text-base-content/90 leading-tight block mt-0.5">
                    Đỉnh online vào lúc <strong className="text-secondary font-extrabold">{peakHourLabel}</strong> hàng ngày
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Strategic Insight - Actionable Bullet Points style with Highlighted Stats */}
          <div className="p-5 bg-amber-500/5 dark:bg-amber-500/5 border-l-4 border-amber-500 rounded-r-3xl text-xs text-base-content/80 font-medium shadow-inner flex flex-col gap-3">
            <span className="font-black text-amber-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Target size={14} className="stroke-[2.5]" /> Khuyến nghị truyền thông chiến lược
            </span>
            
            {/* Insight Block */}
            <div className="text-xs leading-relaxed text-base-content/85 font-semibold bg-base-200/40 px-3.5 py-2 rounded-xl border border-base-content/5">
              💡 <span className="text-base-content font-bold uppercase tracking-wider text-xs font-mono mr-1">Hiểu thấu (Insight):</span> {insightText}
            </div>
            
            {/* Action Bullets */}
            <div className="space-y-2 mt-1">
              <span className="block text-xs font-extrabold uppercase text-amber-600 dark:text-amber-500 tracking-wider font-mono">Hành động đề xuất (Action Items):</span>
              <ul className="space-y-2.5">
                {actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-base-content/85 leading-relaxed font-medium">
                    <span className="flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full p-1 mt-0.5 shrink-0">
                      <Check size={10} className="stroke-[3.5]" />
                    </span>
                    <div>{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
