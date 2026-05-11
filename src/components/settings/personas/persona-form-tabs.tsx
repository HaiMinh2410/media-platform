import * as React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles, Check, RotateCw, Undo2, Loader2 } from 'lucide-react';

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
}

function AutoResizingTextarea({ value, onChange, className, maxHeight = 200, ...props }: AutoResizingTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [maxHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn("overflow-y-auto resize-none", className)}
      style={{ maxHeight: `${maxHeight}px` }}
      {...props}
    />
  );
}


interface PersonaFormTabsProps {
  activeTab: string;
  persona: any;
  onChange: (updates: any) => void;
}

export function PersonaFormTabs({ activeTab, persona, onChange }: PersonaFormTabsProps) {
  const updateSettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  // AI Campaign Proposal States
  const [aiProposal, setAiProposal] = React.useState<{ currentOffer: string; scarcityMessage: string } | null>(null);
  const [originalValues, setOriginalValues] = React.useState<{ currentOffer: string; scarcityMessage: string } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Debounce trigger cho Campaign Name & Objective
  const [debouncedCampaign, setDebouncedCampaign] = React.useState({
    name: persona.campaign_name || '',
    objective: persona.settings?.campaign_objective || 'lead_generation'
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCampaign({
        name: persona.campaign_name || '',
        objective: persona.settings?.campaign_objective || 'lead_generation'
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [persona.campaign_name, persona.settings?.campaign_objective]);

  // Ref ghi nhận giá trị khởi tạo khi Component được Mount để tránh tự kích hoạt
  const initialValuesRef = React.useRef({
    name: persona.campaign_name || '',
    objective: persona.settings?.campaign_objective || 'lead_generation'
  });

  const handleGenerateProposal = async (name: string, objective: string) => {
    if (!name || isGenerating) return;

    setIsGenerating(true);
    try {
      if (!originalValues) {
        setOriginalValues({
          currentOffer: persona.current_offer || '',
          scarcityMessage: persona.scarcity_message || ''
        });
      }

      const res = await fetch('/api/ai-personas/campaign-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignName: name, 
          campaignObjective: objective,
          persona: {
            name: persona.name,
            gender: persona.gender,
            personality: persona.personality,
            tone: persona.tone,
            signature_emojis: persona.signature_emojis,
            custom_instructions: persona.custom_instructions
          }
        }),
      });
      const data = await res.json();

      if (data && !data.error) {
        setAiProposal({
          currentOffer: data.currentOffer,
          scarcityMessage: data.scarcityMessage
        });
        
        onChange({
          current_offer: data.currentOffer,
          scarcity_message: data.scarcityMessage
        });
      }
    } catch (err) {
      console.error('Failed to generate campaign proposal:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (
      debouncedCampaign.name &&
      (debouncedCampaign.name !== initialValuesRef.current.name ||
       debouncedCampaign.objective !== initialValuesRef.current.objective)
    ) {
      handleGenerateProposal(debouncedCampaign.name, debouncedCampaign.objective);
    }
  }, [debouncedCampaign]);

  const handleRewrite = () => {
    handleGenerateProposal(persona.campaign_name || '', persona.settings?.campaign_objective || 'lead_generation');
  };

  const handleAcceptProposal = () => {
    setAiProposal(null);
    setOriginalValues(null);
  };

  const handleRejectProposal = () => {
    if (originalValues) {
      onChange({
        current_offer: originalValues.currentOffer,
        scarcity_message: originalValues.scarcityMessage
      });
    }
    setAiProposal(null);
    setOriginalValues(null);
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

        {/* AI Proposal Action and Info Bars */}
        {isGenerating && (
          <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={18} />
              <div className="text-sm">
                <span className="font-medium text-foreground block">AI đang phân tích và viết đề xuất...</span>
                <span className="text-xs text-foreground-tertiary">Đang tối ưu hóa Lời chào hàng & Thông điệp khan hiếm tối ưu cho chiến dịch</span>
              </div>
            </div>
          </div>
        )}

        {aiProposal && (
          <div className="bg-gradient-to-r from-purple-500/10 via-primary/5 to-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <Sparkles className="text-purple-400 shrink-0 mt-0.5 animate-bounce" size={18} />
              <div className="text-sm">
                <span className="font-semibold text-foreground block">✨ AI đề xuất phương án tối ưu!</span>
                <span className="text-xs text-foreground-tertiary">Đã tự động điền. Hãy điều chỉnh trực tiếp hoặc đồng ý/viết lại ở đây nhen.</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 border-t border-purple-500/10 pt-3">
              <button
                type="button"
                onClick={handleRejectProposal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-foreground/[0.03] border border-foreground/10 hover:bg-foreground/[0.08] transition-all text-foreground"
                title="Khôi phục giá trị gốc"
              >
                <Undo2 size={14} />
                <span>Bỏ qua</span>
              </button>
              <button
                type="button"
                onClick={handleRewrite}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all disabled:opacity-50"
                title="Yêu cầu AI viết phương án khác"
              >
                <RotateCw className={cn("size-3.5", isGenerating && "animate-spin")} size={14} />
                <span>Viết lại</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptProposal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-all"
                title="Đồng ý với đề xuất của AI"
              >
                <Check size={14} />
                <span>Đồng ý</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Lời chào hàng hiện tại (Current Offer)</label>
            {aiProposal && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                <Sparkles size={10} />
                Đề xuất bởi AI
              </span>
            )}
          </div>
          <AutoResizingTextarea
            value={persona.current_offer || ''}
            onChange={(e) => onChange({ current_offer: e.target.value })}
            className={cn(
              "w-full bg-foreground/[0.03] border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[60px]",
              aiProposal 
                ? "border-purple-500/40 ring-2 ring-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)] bg-purple-500/[0.01]" 
                : "border-foreground/10 focus:border-primary/50"
            )}
            placeholder="VD: Giảm giá 50% cho 100 khách hàng đầu tiên mua combo X..."
            maxHeight={200}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Thông điệp khan hiếm (Scarcity)</label>
            {aiProposal && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                <Sparkles size={10} />
                Đề xuất bởi AI
              </span>
            )}
          </div>
          <AutoResizingTextarea
            value={persona.scarcity_message || ''}
            onChange={(e) => onChange({ scarcity_message: e.target.value })}
            className={cn(
              "w-full bg-foreground/[0.03] border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[46px]",
              aiProposal 
                ? "border-purple-500/40 ring-2 ring-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)] bg-purple-500/[0.01]" 
                : "border-foreground/10 focus:border-primary/50"
            )}
            placeholder="VD: Chỉ còn duy nhất 2 suất áp dụng mã giảm giá này thôi ạ..."
            maxHeight={150}
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
