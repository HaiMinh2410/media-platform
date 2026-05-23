'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { RangeSelector, RangeOption } from '@shared/ui/range-selector';

interface Account {
  id: string;
  name: string;
  platform: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountSelector({ 
  accounts, 
  selectedId, 
  onSelect 
}: AccountSelectorProps) {
  
  const getIcon = (platform: string, className?: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': 
        return <Icon name="facebook" size={14} className={className} />;
      case 'instagram': 
        return <Icon name="instagram" size={14} className={className} />;
      default: 
        return <Icon lucide={Users} size={14} className={className} />;
    }
  };

  const options: RangeOption[] = accounts.map(acc => {
    const platform = acc.platform.toLowerCase();
    const iconColorClass = 
      platform === 'facebook' 
        ? 'text-facebook' 
        : platform === 'instagram' 
        ? 'text-instagram' 
        : 'text-base-content/40';

    return {
      id: acc.id,
      label: acc.name,
      icon: (className?: string) => getIcon(acc.platform, className),
      iconColorClass,
      dropdownLabel: (
        <div className="flex flex-col items-start overflow-hidden leading-tight">
          <span className="text-xs font-bold truncate w-full">{acc.name}</span>
          <span className="text-[9px] uppercase tracking-widest font-mono opacity-50">
            {acc.platform}
          </span>
        </div>
      )
    };
  });

  return (
    <RangeSelector
      value={selectedId}
      onChange={onSelect}
      options={options}
      menuMinWidth="min-w-[200px]"
      menuAlign="right"
    />
  );
}
