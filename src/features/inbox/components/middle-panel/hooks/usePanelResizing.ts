import { useRef, useCallback, useEffect } from 'react';
import { useInboxStore } from '../../../store/inbox.store';

export function usePanelResizing() {
  const { middlePanelWidth, setMiddlePanelWidth } = useInboxStore();
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const stopResizingRef = useRef<() => void>(() => {});

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      // Limits width between 280px and 500px
      if (newWidth > 280 && newWidth < 500) {
        setMiddlePanelWidth(newWidth);
      }
    }
  }, [setMiddlePanelWidth]);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizingRef.current);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

  useEffect(() => {
    stopResizingRef.current = stopResizing;
  }, [stopResizing]);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  return {
    middlePanelWidth,
    panelRef,
    startResizing
  };
}
