'use client';

import React, { useState, useEffect } from 'react';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { ContactEditModal } from './modals/contact-edit-modal';
import { ManageTagsModal } from './modals/manage-tags-modal';
import { useInboxStore } from '../store/inbox.store';
import { cn } from '@/lib/utils';
import { 
  ChevronRight
} from 'lucide-react';

// Sub-components
import { SidebarCollapsed } from './right-sidebar/sidebar-collapsed';
import { SearchTab } from './right-sidebar/search-tab';
import { CustomerProfile } from './right-sidebar/detail-tab/customer-profile';
import { ContactDetails } from './right-sidebar/detail-tab/contact-details';
import { LeadStageSelector } from './right-sidebar/detail-tab/lead-stage-selector';
import { TagManager } from './right-sidebar/detail-tab/tag-manager';
import { NoteManager } from './right-sidebar/detail-tab/note-manager';

type TabType = 'detail' | 'ai' | 'search';

type RightSidebarProps = {
  workspaceId: string;
  conversationId: string;
  customerName?: string;
  customerAvatar?: string;
  platform: string;
  tags: string[];
  priority: string | null;
  sentiment: string | null;
  suggestions: any[];
  loadingSuggestions: boolean;
  onUseSuggestion: (text: string) => void;
  onDismissSuggestion: (id: string) => void;
  onUpdateTags: (tags: string[]) => void;
  onUpdatePriority: (priority: string) => void;
  onUpdateSentiment: (sentiment: string) => void;
  onJumpToMessage?: (id: string) => void;
  contactInfo?: {
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  customerUsername?: string;
  customerLink?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function RightSidebar({
  workspaceId,
  conversationId,
  customerName,
  customerAvatar,
  platform,
  tags,
  priority,
  sentiment,
  suggestions,
  loadingSuggestions,
  onUseSuggestion,
  onDismissSuggestion,
  onUpdateTags,
  onUpdatePriority,
  onUpdateSentiment,
  onJumpToMessage,
  contactInfo,
  isCollapsed,
  onToggleCollapse,
  customerUsername,
  customerLink,
}: RightSidebarProps) {
  const activeTab = useInboxStore((state) => state.rightSidebarTab) as TabType;
  const setActiveTab = useInboxStore((state) => state.setRightSidebarTab);
  const { activeThreads, removeActiveThread, addActiveThread } = useInboxStore();
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync current conversation to activeThreads in store
  useEffect(() => {
    if (conversationId && (customerName || customerAvatar)) {
      addActiveThread({
        id: conversationId,
        sender_name: customerName,
        customer_avatar: customerAvatar,
      } as any);
    }
  }, [conversationId, customerName, customerAvatar, addActiveThread]);

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    try {
      await fetch(`/api/conversations/${conversationId}/sync-profile`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to sync profile:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateContact = async (data: any) => {
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to update contact info:', err);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin liên hệ không?')) return;
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: null,
          email: null,
          birthday: null,
          address: null,
          city: null,
          state: null,
          zip_code: null
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete contact info:', err);
    }
  };

  if (isCollapsed) {
    return (
      <SidebarCollapsed 
        customerName={customerName}
        customerAvatar={customerAvatar}
        activeThreads={activeThreads}
        conversationId={conversationId}
        onToggleCollapse={onToggleCollapse}
        removeActiveThread={removeActiveThread}
      />
    );
  }

  return (
    <aside className="flex flex-col h-full bg-base-200 border-l border-foreground/5" data-sidebar="right">
      {/* Tab Header */}
      <div className="flex items-center gap-1 p-2 border-b border-foreground/10">
        <button 
          className={cn(
            "flex-1 py-2 text-13 font-semibold text-foreground-tertiary rounded-md transition-all hover:text-foreground-secondary hover:bg-foreground/5",
            activeTab === 'detail' && "text-accent-primary bg-accent-primary/10"
          )}
          onClick={() => setActiveTab('detail')}
        >
          Detail
        </button>
        <button 
          className={cn(
            "flex-1 py-2 text-13 font-semibold text-foreground-tertiary rounded-md transition-all hover:text-foreground-secondary hover:bg-foreground/5",
            activeTab === 'ai' && "text-accent-primary bg-accent-primary/10"
          )}
          onClick={() => setActiveTab('ai')}
        >
          AI Assist
        </button>
        {activeTab === 'search' && (
          <button 
            className="flex-1 py-2 text-13 font-semibold text-accent-primary bg-accent-primary/10 rounded-md transition-all"
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10">
        {activeTab === 'detail' && (
          <div className="p-4 flex flex-col gap-6">
            <CustomerProfile 
              customerName={customerName}
              customerAvatar={customerAvatar}
              platform={platform}
              customerUsername={customerUsername}
              customerLink={customerLink}
              isSyncing={isSyncing}
              onSyncProfile={handleSyncProfile}
              onToggleCollapse={onToggleCollapse}
            />

            <ContactDetails 
              contactInfo={contactInfo}
              onEdit={() => setIsEditingContact(true)}
              onDelete={handleDeleteContact}
            />

            <LeadStageSelector 
              priority={priority}
              onUpdatePriority={onUpdatePriority}
            />

            <TagManager 
              workspaceId={workspaceId}
              tags={tags}
              onUpdateTags={onUpdateTags}
              setIsManageTagsOpen={setIsManageTagsOpen}
            />

            <NoteManager conversationId={conversationId} />
          </div>
        )}

        {activeTab === 'ai' && (
          <AiSuggestionPanel
            suggestions={suggestions}
            tags={tags}
            priority={priority}
            sentiment={sentiment}
            loading={loadingSuggestions}
            onUse={onUseSuggestion}
            onDismiss={onDismissSuggestion}
            onUpdateTags={onUpdateTags}
            onUpdatePriority={onUpdatePriority}
            onUpdateSentiment={onUpdateSentiment}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab 
            conversationId={conversationId}
            onJumpToMessage={onJumpToMessage}
            onClose={() => setActiveTab('detail')}
          />
        )}
      </div>

      <ContactEditModal 
        isOpen={isEditingContact}
        onClose={() => setIsEditingContact(false)}
        onSave={handleUpdateContact}
        initialData={{
          name: customerName,
          avatar: customerAvatar,
          ...contactInfo
        }}
      />
      <ManageTagsModal 
        workspaceId={workspaceId}
        isOpen={isManageTagsOpen}
        onClose={() => {
          setIsManageTagsOpen(false);
          // Tags are updated via the store or event in subcomponents
        }}
      />
    </aside>
  );
}
