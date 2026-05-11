'use client';

// Persona edit client component
import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Play, Bot, User2, MessageCircle, Settings2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { PersonaFormTabs } from './persona-form-tabs';
import { ChatSimulator } from './chat-simulator';
import { toast } from 'sonner';

interface PersonaEditClientProps {
  account: any;
  initialPersona: any;
}

export function PersonaEditClient({ account, initialPersona }: PersonaEditClientProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [persona, setPersona] = useState(initialPersona);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/ai-personas/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });

      if (!res.ok) throw new Error('Failed to save persona');
      
      toast.success('Lưu cấu hình Persona thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi lưu Persona');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Cơ bản', icon: User2 },
    { id: 'character', label: 'Tính cách & Giọng điệu', icon: Bot },
    { id: 'campaign', label: 'Chiến dịch (Sales)', icon: MessageCircle },
    { id: 'advanced', label: 'Prompt nâng cao', icon: Sparkles },
    { id: 'safety', label: 'An toàn & Tham số', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings/personas" className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <Icon lucide={ArrowLeft} size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-semibold m-0 flex items-center gap-2">
              Cấu hình Persona: {account.platform_user_name}
            </h2>
            <p className="text-sm text-foreground-tertiary">
              Tùy chỉnh AI Agent cho tài khoản {account.platform === 'instagram' ? 'Instagram' : 'Facebook'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isSaving ? <Icon lucide={Loader2} className="animate-spin" size={18} /> : <Icon lucide={Save} size={18} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 flex-1 min-h-0">
        
        {/* Left Panel: Form */}
        <div className="flex flex-col bg-foreground/[0.02] border border-foreground/10 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-foreground/10 px-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-tertiary hover:text-foreground-secondary hover:bg-foreground/5"
                )}
              >
                <Icon lucide={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
            <PersonaFormTabs 
              activeTab={activeTab} 
              persona={persona} 
              onChange={(updates: any) => setPersona({ ...persona, ...updates })} 
            />
          </div>
        </div>

        {/* Right Panel: Simulator */}
        <div className="flex flex-col bg-foreground/[0.02] border border-foreground/10 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-foreground/10 bg-foreground/[0.01] flex justify-between items-center">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Icon lucide={Play} size={16} className="text-primary" />
              Live Simulator
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-primary/10 text-primary rounded-full">Test Mode</span>
          </div>
          <div className="flex-1 min-h-0">
            <ChatSimulator accountId={account.id} personaDraft={persona} accountName={account.platform_user_name} />
          </div>
        </div>

      </div>
    </div>
  );
}
