import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Award } from 'lucide-react';
import { cn } from '../primitives';

interface DemographicItem {
  name: string;
  value: number;
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
      className="glass rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-info" />
            <h4 className="font-bold text-foreground tracking-tight">Khu vực sinh sống</h4>
          </div>
          
          {/* Country / City Selector Tabs */}
          <div className="flex p-0.5 bg-foreground/5 border border-foreground/10 rounded-xl select-none">
            <button
              onClick={() => setLocationTab('country')}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer",
                locationTab === 'country' ? "bg-primary text-primary-content shadow-lg font-extrabold" : "text-foreground/40 hover:text-foreground/80"
              )}
            >
              Quốc gia
            </button>
            <button
              onClick={() => setLocationTab('city')}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer",
                locationTab === 'city' ? "bg-primary text-primary-content shadow-lg font-extrabold" : "text-foreground/40 hover:text-foreground/80"
              )}
            >
              Thành phố
            </button>
          </div>
        </div>

        {topLocations.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-foreground/20 text-xs">Không có dữ liệu vị trí</span>
          </div>
        ) : (
          <div className="space-y-4">
            {topLocations.map((loc: DemographicItem, idx: number) => {
              const percent = Math.round((loc.value / totalLocationVal) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground/70 group-hover:text-foreground transition-colors flex items-center gap-1.5">
                      <MapPin size={12} className="text-info/75" />
                      {loc.name}
                    </span>
                    <span className="text-foreground font-bold">{percent}%</span>
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center gap-2 text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
        <Award size={14} className="text-info/50" />
        <span>Phân tích dựa trên {followersCount.toLocaleString()} followers</span>
      </div>
    </motion.div>
  );
}
