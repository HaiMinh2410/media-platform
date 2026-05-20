'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface DraftData {
  content: string;
  selectedAccountIds: string[];
  mediaFiles: any[]; // Matches the shape of mediaFiles in PostComposerRoot
}

export function useDraft(workspaceId: string) {
  const lastSavedRef = useRef<string>('');
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const STORAGE_KEY = `post_draft_${workspaceId}`;

  // LocalStorage methods
  const saveToLocalStorage = useCallback((data: DraftData) => {
    try {
      const serialized = JSON.stringify(data);
      if (serialized === lastSavedRef.current) return;
      
      localStorage.setItem(STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }, [STORAGE_KEY]);

  const getLocalStorageDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as DraftData : null;
    } catch (e) {
      return null;
    }
  }, [STORAGE_KEY]);

  // API methods
  const saveToCloud = useCallback(async (data: DraftData) => {
    try {
      // Clean data: only save media that is 'done' or at least has a URL
      const cleanMedia = data.mediaFiles.filter(f => f.status === 'done' || f.url);
      
      await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workspaceId,
          content: data.content,
          selectedAccountIds: data.selectedAccountIds,
          mediaFiles: cleanMedia,
        }),
      });
    } catch (e) {
      console.error('Failed to sync draft to cloud:', e);
    }
  }, [workspaceId]);

  // Main interface
  const handleAutoSave = useCallback((data: DraftData) => {
    // 1. Immediate save to LocalStorage (debounced by caller usually, but we ensure persistence)
    saveToLocalStorage(data);

    // 2. Debounced save to Cloud (30s)
    if (cloudSyncTimeoutRef.current) clearTimeout(cloudSyncTimeoutRef.current);
    cloudSyncTimeoutRef.current = setTimeout(() => {
      saveToCloud(data);
    }, 30000);
  }, [saveToLocalStorage, saveToCloud]);

  const clearDraft = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    if (cloudSyncTimeoutRef.current) clearTimeout(cloudSyncTimeoutRef.current);
    
    try {
      await fetch(`/api/posts/draft?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      // Ignore
    }
  }, [workspaceId, STORAGE_KEY]);

  return {
    handleAutoSave,
    clearDraft,
    getLocalStorageDraft,
  };
}
