'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ROLE_TEMPLATES } from '@/application/ai/role-templates';
import styles from './bot-config-client.module.css';

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
        setConfig(json.data);
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
    return <div className={styles.loading}>Loading configuration...</div>;
  }

  if (!config) {
    return <div className={styles.error}>Error loading configuration</div>;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.cardTitle}>AI Assistant Status</h2>
            <p className={styles.cardDesc}>Enable or disable the AI for this account</p>
          </div>
          <label className={styles.toggle}>
            <input 
              type="checkbox" 
              checked={config.is_active} 
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </Card>

      <Card className={`${styles.card} ${!config.is_active ? styles.cardDisabled : ''}`}>
        <h2 className={styles.sectionTitle}>Behavior Settings</h2>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            System Prompt
            <span className={styles.helpText}>Instructions for the AI on how to respond. Be specific about tone and boundary.</span>
          </label>

          <select 
            disabled={!config.is_active}
            className={`${styles.select} ${styles.templateSelect}`}
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
            className={styles.textarea}
            value={config.system_prompt || ''}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
            placeholder="You are a helpful customer support assistant for..."
            rows={5}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Model Selection</label>
            <select 
              disabled={!config.is_active}
              className={styles.select}
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

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Confidence Threshold ({config.confidence_threshold.toFixed(2)})
            </label>
            <input 
              disabled={!config.is_active}
              type="range" 
              min="0" max="1" step="0.05"
              className={styles.range}
              value={config.confidence_threshold}
              onChange={(e) => setConfig({ ...config, confidence_threshold: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.checkboxWrapper}>
            <input 
              disabled={!config.is_active}
              type="checkbox" 
              id="autoSend"
              checked={config.auto_send}
              onChange={(e) => setConfig({ ...config, auto_send: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="autoSend" className={styles.checkboxLabel}>
              <strong>Auto-Reply</strong>
              <span>Automatically send replies that pass the confidence threshold instead of drafting suggestions.</span>
            </label>
          </div>

          {config.auto_send && (
            <div className={styles.autoReplyFilters}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Auto-Reply for Priorities:</label>
                <div className={styles.filterOptions}>
                  {PRIORITY_OPTIONS.map(prio => (
                    <label key={prio} className={styles.filterOption}>
                      <input 
                        type="checkbox"
                        checked={config.auto_reply_priorities.includes(prio)}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...config.auto_reply_priorities, prio]
                            : config.auto_reply_priorities.filter(p => p !== prio);
                          setConfig({ ...config, auto_reply_priorities: updated });
                        }}
                      />
                      <span className={styles.capitalize}>{prio}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Auto-Reply for Sentiments:</label>
                <div className={styles.filterOptions}>
                  {SENTIMENT_OPTIONS.map(sent => (
                    <label key={sent} className={styles.filterOption}>
                      <input 
                        type="checkbox"
                        checked={config.auto_reply_sentiments.includes(sent)}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...config.auto_reply_sentiments, sent]
                            : config.auto_reply_sentiments.filter(s => s !== sent);
                          setConfig({ ...config, auto_reply_sentiments: updated });
                        }}
                      />
                      <span className={styles.capitalize}>{sent}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className={`${styles.card} ${!config.is_active ? styles.cardDisabled : ''}`}>
        <h2 className={styles.sectionTitle}>Intent Routing</h2>
        <p className={styles.sectionDesc}>Specify trigger labels to classify intents. Intents outside these will be escalated to humans.</p>
        
        <div className={styles.formGroup}>
          <div className={styles.tagInputWrapper}>
            <div className={styles.tagsContainer}>
              {config.trigger_labels?.map(label => (
                <span key={label} className={styles.tag}>
                  {label}
                  <button 
                    disabled={!config.is_active}
                    className={styles.tagRemoveBtn} 
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
                className={styles.tagInput}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.footer}>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isLoading} 
          className={styles.saveBtn}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
