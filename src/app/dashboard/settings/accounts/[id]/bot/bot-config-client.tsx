'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ROLE_TEMPLATES } from '@/application/ai/role-templates';
import { cn } from '@/lib/utils';

type BotConfig = {
  is_active: boolean;
  trigger_labels: string[];
  confidence_threshold: number;
  auto_send: boolean;
  system_prompt: string;
  model: string;
  auto_reply_priorities: string[];
  auto_reply_sentiments: string[];
};

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const SENTIMENT_OPTIONS = ['positive', 'neutral', 'negative', 'frustrated'];

export function BotConfigClient({ accountId }: { accountId: string }) {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/accounts/${accountId}/bot`);
        if (!res.ok) throw new Error('Failed to fetch config');
        const json = await res.json();
        setConfig({
          ...json.data,
          auto_reply_priorities: json.data.auto_reply_priorities || [],
          auto_reply_sentiments: json.data.auto_reply_sentiments || []
        });
      } catch (err) {
        toast.error('Could not load bot configuration');
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, [accountId]);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/bot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save config');
      toast.success('Bot configuration saved successfully');
    } catch (err) {
      toast.error('Failed to save bot configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const addLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newLabel.trim()) {
      e.preventDefault();
      if (!config?.trigger_labels.includes(newLabel.trim())) {
        setConfig((prev) => prev ? { ...prev, trigger_labels: [...prev.trigger_labels, newLabel.trim()] } : null);
      }
      setNewLabel('');
    }
  };

  const removeLabel = (label: string) => {
    setConfig((prev) => prev ? { ...prev, trigger_labels: prev.trigger_labels.filter((l) => l !== label) } : null);
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-foreground-secondary bg-foreground/[0.02] rounded-xl border border-dashed border-foreground/10">
        Loading configuration...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-10 text-center text-rose-500 bg-rose-500/5 rounded-xl border border-dashed border-rose-500/20">
        Error loading configuration
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 bg-foreground/[0.02] border-foreground/10 flex flex-col gap-5 transition-opacity duration-300 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">AI Assistant Status</h2>
            <p className="m-1 text-sm text-foreground-secondary">Enable or disable the AI for this account</p>
          </div>
          <label className="relative inline-block w-12 h-6">
            <input 
              type="checkbox" 
              checked={config.is_active} 
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="opacity-0 w-0 h-0 peer"
            />
            <span className="absolute inset-0 cursor-pointer bg-foreground/10 rounded-full transition-all peer-checked:bg-primary before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-base-100 before:rounded-full before:transition-all peer-checked:before:translate-x-6"></span>
          </label>
        </div>
      </Card>

      <Card className={cn(
        "p-6 bg-foreground/[0.02] border-foreground/10 flex flex-col gap-5 transition-all duration-300 backdrop-blur-xl",
        !config.is_active && "opacity-50 pointer-events-none"
      )}>
        <h2 className="m-0 text-base font-semibold text-foreground">Behavior Settings</h2>
        
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            System Prompt
            <span className="text-xs font-normal text-foreground-tertiary">Instructions for the AI on how to respond. Be specific about tone and boundary.</span>
          </label>

          <select 
            disabled={!config.is_active}
            className="mb-2 w-full bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm font-medium text-primary outline-none cursor-pointer transition-all hover:bg-primary/15 hover:border-primary/40"
            onChange={(e) => {
              const template = ROLE_TEMPLATES.find(t => t.id === e.target.value);
              if (template) {
                setConfig({ ...config, system_prompt: template.prompt });
                toast.info(`Đã áp dụng mẫu: ${template.name}`);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>✨ Chọn role mẫu để điền nhanh...</option>
            {ROLE_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
            ))}
          </select>

          <textarea 
            disabled={!config.is_active}
            className="w-full bg-background-tertiary border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground font-sans outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/5 transition-all resize-vertical min-h-[100px]"
            value={config.system_prompt || ''}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
            placeholder="You are a helpful customer support assistant for..."
            rows={5}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Model Selection</label>
            <select 
              disabled={!config.is_active}
              className="w-full bg-background-tertiary border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/5 transition-all"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            >
              <option value="auto">Auto Selection (Intelligent routing)</option>
              <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile (Recommended)</option>
              <option value="llama-3.1-8b-instant">LLaMA 3.1 8B Instant (Fastest / Cheapest)</option>
              <option value="qwen-qwq-32b">Qwen3 32B (Multilingual · 32k Context)</option>
              <option value="openai/gpt-oss-120b">GPT-OSS 120B (Highest Quality / Reasoning)</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Confidence Threshold ({config.confidence_threshold.toFixed(2)})
            </label>
            <input 
              disabled={!config.is_active}
              type="range" 
              min="0" max="1" step="0.05"
              className="w-full mt-3 accent-primary"
              value={config.confidence_threshold}
              onChange={(e) => setConfig({ ...config, confidence_threshold: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 mt-3">
            <input 
              disabled={!config.is_active}
              type="checkbox" 
              id="autoSend"
              checked={config.auto_send}
              onChange={(e) => setConfig({ ...config, auto_send: e.target.checked })}
              className="w-[18px] h-[18px] mt-0.5 accent-primary cursor-pointer"
            />
            <label htmlFor="autoSend" className="flex flex-col gap-1 text-sm text-foreground cursor-pointer select-none">
              <strong className="font-semibold">Auto-Reply</strong>
              <span className="font-normal text-foreground-secondary leading-relaxed">Automatically send replies that pass the confidence threshold instead of drafting suggestions.</span>
            </label>
          </div>

          {config.auto_send && (
            <div className="mt-4 p-4 bg-foreground/[0.03] rounded-xl border border-foreground/5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-wider text-foreground-tertiary">Auto-Reply for Priorities:</label>
                <div className="flex flex-wrap gap-3">
                  {PRIORITY_OPTIONS.map(prio => (
                    <label key={prio} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-foreground cursor-pointer bg-foreground/[0.05] border border-transparent transition-all hover:bg-foreground/[0.08]",
                      config.auto_reply_priorities.includes(prio) && "bg-primary/10 border-primary/30 text-primary"
                    )}>
                      <input 
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-blue-500"
                        checked={(config.auto_reply_priorities || []).includes(prio)}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...config.auto_reply_priorities, prio]
                            : config.auto_reply_priorities.filter(p => p !== prio);
                          setConfig({ ...config, auto_reply_priorities: updated });
                        }}
                      />
                      <span className="capitalize">{prio}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-wider text-foreground-tertiary">Auto-Reply for Sentiments:</label>
                <div className="flex flex-wrap gap-3">
                  {SENTIMENT_OPTIONS.map(sent => (
                    <label key={sent} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-foreground cursor-pointer bg-foreground/[0.05] border border-transparent transition-all hover:bg-foreground/[0.08]",
                      config.auto_reply_sentiments.includes(sent) && "bg-primary/10 border-primary/30 text-primary"
                    )}>
                      <input 
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-blue-500"
                        checked={(config.auto_reply_sentiments || []).includes(sent)}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...config.auto_reply_sentiments, sent]
                            : config.auto_reply_sentiments.filter(s => s !== sent);
                          setConfig({ ...config, auto_reply_sentiments: updated });
                        }}
                      />
                      <span className="capitalize">{sent}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className={cn(
        "p-6 bg-foreground/[0.02] border-foreground/10 flex flex-col gap-5 transition-all duration-300 backdrop-blur-xl",
        !config.is_active && "opacity-50 pointer-events-none"
      )}>
        <h2 className="m-0 text-base font-semibold text-foreground">Intent Routing</h2>
        <p className="m-0 text-sm text-foreground-secondary -mt-2">Specify trigger labels to classify intents. Intents outside these will be escalated to humans.</p>
        
        <div className="flex flex-col gap-2">
          <div className="bg-background-tertiary border border-foreground/10 rounded-lg p-2 transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/5">
            <div className="flex flex-wrap items-center gap-2">
              {config.trigger_labels?.map(label => (
                <span key={label} className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 animate-in zoom-in-95">
                  {label}
                  <button 
                    disabled={!config.is_active}
                    className="text-lg leading-none opacity-70 hover:opacity-100 transition-opacity" 
                    onClick={() => removeLabel(label)}
                  >
                    &times;
                  </button>
                </span>
              ))}
                <input
                  disabled={!config.is_active}
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={addLabel}
                  placeholder="Add trigger label and press Enter"
                  className="bg-transparent border-none text-base-content outline-none text-sm flex-1 min-w-[200px] py-1.5 px-2"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isLoading} 
          className="px-8"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
