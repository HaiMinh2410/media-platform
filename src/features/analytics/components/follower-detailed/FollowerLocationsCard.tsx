import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Award, Sparkles } from 'lucide-react';
import { cn } from '../primitives';

interface DemographicItem {
  name: string;
  value: number;
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  VN: { name: 'Vietnam', flag: '🇻🇳' },
  US: { name: 'United States', flag: '🇺🇸' },
  ID: { name: 'Indonesia', flag: '🇮🇩' },
  TH: { name: 'Thailand', flag: '🇹🇭' },
  PH: { name: 'Philippines', flag: '🇵🇭' },
  MY: { name: 'Malaysia', flag: '🇲🇾' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  KR: { name: 'South Korea', flag: '🇰🇷' },
  IN: { name: 'India', flag: '🇮🇳' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
  MX: { name: 'Mexico', flag: '🇲🇽' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  FR: { name: 'France', flag: '🇫🇷' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  CN: { name: 'China', flag: '🇨🇳' },
  RU: { name: 'Russia', flag: '🇷🇺' },
  ES: { name: 'Spain', flag: '🇪🇸' },
  IT: { name: 'Italy', flag: '🇮🇹' },
};

function formatCountryName(code: string): string {
  const cleanCode = code.trim().toUpperCase();
  const country = COUNTRY_MAP[cleanCode];
  if (country) {
    return `${country.flag} ${country.name}`;
  }
  
  if (cleanCode.length === 2) {
    try {
      const codePoints = cleanCode
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      const flag = String.fromCodePoint(...codePoints);
      return `${flag} ${cleanCode}`;
    } catch (e) {
      return code;
    }
  }
  
  return code;
}

interface FollowerLocationsCardProps {
  countryData: DemographicItem[];
  cityData: DemographicItem[];
  followersCount: number;
}

export function FollowerLocationsCard({
  countryData = [],
  cityData = [],
  followersCount
}: FollowerLocationsCardProps) {
  const [locationTab, setLocationTab] = useState<'country' | 'city'>('country');

  const locations = locationTab === 'country' ? countryData : cityData;
  const topLocations = locations.slice(0, 5);
  const totalLocationVal = locations.reduce((sum, l) => sum + l.value, 0) || 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md flex flex-col justify-between font-sans min-h-[380px]"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-info animate-pulse" />
            <h4 className="font-bold text-base-content tracking-tight font-brand">Khu vực sinh sống</h4>
          </div>
          
          {/* Country / City Selector Tabs */}
          <div className="flex p-0.5 bg-base-200/70 border border-base-content/5 rounded-2xl select-none shadow-inner">
            <button
              onClick={() => setLocationTab('country')}
              className={cn(
                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer font-brand",
                locationTab === 'country' 
                  ? "bg-primary text-primary-content shadow-sm font-extrabold" 
                  : "text-base-content/40 hover:text-base-content/70"
              )}
            >
              Quốc gia
            </button>
            <button
              onClick={() => setLocationTab('city')}
              className={cn(
                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer font-brand",
                locationTab === 'city' 
                  ? "bg-primary text-primary-content shadow-sm font-extrabold" 
                  : "text-base-content/40 hover:text-base-content/70"
              )}
            >
              Thành phố
            </button>
          </div>
        </div>

        {topLocations.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-base-content/20 text-xs font-semibold">Không có dữ liệu vị trí</span>
          </div>
        ) : (
          <div className="space-y-4">
            {topLocations.map((loc: DemographicItem, idx: number) => {
              const percent = Math.round((loc.value / totalLocationVal) * 100) || 0;
              const displayName = locationTab === 'country' ? formatCountryName(loc.name) : loc.name;
              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-base-content/70 group-hover:text-base-content transition-colors flex items-center gap-1.5 font-brand">
                      <MapPin size={12} className="text-info/75" />
                      {displayName}
                    </span>
                    <span className="text-base-content font-bold font-mono">{percent}%</span>
                  </div>
                  <div className="h-2 bg-base-200 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full bg-linear-to-r from-info to-primary rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-5 pt-4 border-t border-base-content/5 flex items-center gap-2 text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">
        <Award size={14} className="text-info/50" />
        <span>Phân tích dựa trên {followersCount.toLocaleString()} followers</span>
      </div>
    </motion.div>
  );
}
