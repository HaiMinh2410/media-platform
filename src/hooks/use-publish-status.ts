'use client';

import { useState, useEffect } from 'react';

/**
 * Trạng thái của một Batch Publish.
 */
export interface PublishStatusSummary {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_FAILURE';
  jobs: any[];
}

/**
 * Custom hook để subscribe vào SSE endpoint và nhận cập nhật trạng thái publish job realtime.
 * @param batchId ID của phiên đăng bài (UUID). Nếu null, hook sẽ không thực hiện gì.
 */
export function usePublishStatus(batchId: string | null) {
  const [status, setStatus] = useState<PublishStatusSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!batchId) {
      setStatus(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Khởi tạo EventSource kết nối tới SSE endpoint
    const eventSource = new EventSource(`/api/publish/status/${batchId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          eventSource.close();
        } else {
          setStatus(data);
          
          // Kiểm tra xem đã đạt trạng thái kết thúc chưa để đóng connection
          const isTerminal = data.status === 'COMPLETED' || 
                           data.status === 'FAILED' || 
                           data.status === 'PARTIAL_FAILURE';
          
          if (isTerminal) {
            setIsLoading(false);
            eventSource.close();
          }
        }
      } catch (err) {
        console.error('[usePublishStatus] Parse error:', err);
        setError('Failed to parse status update');
        setIsLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error('[usePublishStatus] SSE Error:', err);
      // EventSource có cơ chế tự động reconnect mặc định.
      // Tuy nhiên, chúng ta có thể thông báo cho UI biết đang gặp vấn đề kết nối.
      setError('Connection interrupted. Retrying...');
    };

    // Cleanup khi component unmount hoặc batchId thay đổi
    return () => {
      eventSource.close();
    };
  }, [batchId]);

  return { 
    status, 
    error, 
    isLoading,
    isFinished: status ? (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'PARTIAL_FAILURE') : false
  };
}
