import * as React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface PersonaFormTabsProps {
  activeTab: string;
  persona: any;
  onChange: (updates: any) => void;
}

export function PersonaFormTabs({ activeTab, persona, onChange }: PersonaFormTabsProps) {
  const updateSettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  if (activeTab === 'basic') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tên Persona (Tên nhân viên ảo)</label>
          <input
            type="text"
            value={persona.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="VD: Em, Mai, Trợ lý..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Giới tính</label>
            <select
              value={persona.gender}
              onChange={(e) => onChange({ gender: e.target.value })}
              className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
            >
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="neutral">Phi giới tính</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Độ tuổi</label>
            <input
              type="number"
              value={persona.age || ''}
              onChange={(e) => onChange({ age: parseInt(e.target.value) || 20 })}
              className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="VD: 22"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'character') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            Tính cách <HelpCircle size={14} className="text-foreground-tertiary" />
          </label>
          <textarea
            value={persona.personality}
            onChange={(e) => onChange({ personality: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-y"
            placeholder="VD: Vui vẻ, nhiệt tình, hơi gen Z một chút, hay dùng teencode nhẹ..."
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tông giọng (Tone)</label>
          <textarea
            value={persona.tone}
            onChange={(e) => onChange({ tone: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-y"
            placeholder="VD: Chuyên nghiệp nhưng gần gũi, xưng hô anh/chị và em..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Biểu tượng cảm xúc đặc trưng (Emojis)</label>
          <input
            type="text"
            value={persona.signature_emojis?.join(', ') || ''}
            onChange={(e) => onChange({ signature_emojis: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="VD: ✨, 💖, 🥰 (ngăn cách bằng dấu phẩy)"
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'campaign') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tên Chiến dịch</label>
          <input
            type="text"
            value={persona.campaign_name || ''}
            onChange={(e) => onChange({ campaign_name: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="VD: Sale Cuối Tháng 5"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Mục tiêu chiến dịch (Objective)</label>
          <select
            value={persona.settings?.campaign_objective || 'lead_generation'}
            onChange={(e) => updateSettings('campaign_objective', e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
          >
            <option value="lead_generation">Thu thập Lead (SĐT/Email)</option>
            <option value="direct_sale">Chốt Sale Trực tiếp (Gửi Link)</option>
            <option value="support">Chăm sóc Khách hàng (Support)</option>
            <option value="engagement">Tăng tương tác (Engagement)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Lời chào hàng hiện tại (Current Offer)</label>
          <textarea
            value={persona.current_offer || ''}
            onChange={(e) => onChange({ current_offer: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-y"
            placeholder="VD: Giảm giá 50% cho 100 khách hàng đầu tiên mua combo X..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Thông điệp khan hiếm (Scarcity)</label>
          <input
            type="text"
            value={persona.scarcity_message || ''}
            onChange={(e) => onChange({ scarcity_message: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="VD: Chỉ còn duy nhất 2 suất áp dụng mã giảm giá này thôi ạ..."
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'advanced') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <HelpCircle size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary/90 leading-relaxed">
            Khu vực dành cho Prompt Engineer. Các thiết lập này sẽ ghi đè hoặc bổ sung vào System Prompt gốc của Agent.
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Custom Instructions (Chỉ dẫn bổ sung)</label>
          <textarea
            value={persona.custom_instructions || ''}
            onChange={(e) => onChange({ custom_instructions: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] font-mono text-sm"
            placeholder="VD: Never mention competitors. Always push the VIP package first."
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">System Prompt Override (Ghi đè toàn bộ)</label>
            <button 
              onClick={() => onChange({ system_prompt_override: 'Bạn là một trợ lý ảo siêu cấp...' })}
              className="text-xs text-primary font-medium hover:underline"
            >
              Load Default Playbook 2.0
            </button>
          </div>
          <textarea
            value={persona.system_prompt_override || ''}
            onChange={(e) => onChange({ system_prompt_override: e.target.value })}
            className="w-full bg-[#1e1e1e] text-[#d4d4d4] border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[200px] font-mono text-sm"
            placeholder="Leave blank to use dynamic system prompt..."
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'safety') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Delay Tối thiểu (giây)</label>
            <input
              type="number"
              value={persona.settings?.delay_min || 15}
              onChange={(e) => updateSettings('delay_min', parseInt(e.target.value) || 0)}
              className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Delay Tối đa (giây)</label>
            <input
              type="number"
              value={persona.settings?.delay_max || 120}
              onChange={(e) => updateSettings('delay_max', parseInt(e.target.value) || 0)}
              className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Giới hạn gửi Link (trên mỗi hội thoại)</label>
          <input
            type="number"
            value={persona.settings?.link_rate_limit || 3}
            onChange={(e) => updateSettings('link_rate_limit', parseInt(e.target.value) || 0)}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <p className="text-xs text-foreground-tertiary">Giới hạn số lần AI được phép gửi link chốt sale để tránh spam.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Blacklist Keywords (Các từ cấm kỵ)</label>
          <textarea
            value={persona.settings?.blacklist_keywords?.join(', ') || ''}
            onChange={(e) => updateSettings('blacklist_keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
            placeholder="VD: lừa đảo, báo công an, scam..."
          />
          <p className="text-xs text-foreground-tertiary">Nếu tin nhắn của khách chứa các từ này, AI sẽ ngừng tương tác và chuyển cho người thật (Escalate).</p>
        </div>
      </div>
    );
  }

  return null;
}
