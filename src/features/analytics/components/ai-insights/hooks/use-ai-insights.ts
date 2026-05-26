import { useState, useEffect } from 'react';

export function useAIInsights(range?: string) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFanType, setSelectedFanType] = useState<string>('All');
  
  // State chứa toàn bộ dữ liệu từ API
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu thực tế
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Truyền range làm query parameter để API có thể hỗ trợ lọc trong tương lai
      const url = range ? `/api/ai-agent/metrics?range=${range}` : '/api/ai-agent/metrics';
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`❌ AI Metrics API returned ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('❌ Failed to fetch AI Metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mount component lần đầu
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dữ liệu mỗi khi component đã mounted hoặc range thay đổi từ Header global
  useEffect(() => {
    if (mounted) {
      fetchMetrics();
    }
  }, [mounted, range]);

  // Lọc kịch bản
  const filteredScripts = data?.topScripts 
    ? data.topScripts.filter((s: any) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedFanType === 'All' || s.fanType === selectedFanType;
        return matchesSearch && matchesType;
      })
    : [];

  return {
    mounted,
    searchQuery,
    setSearchQuery,
    selectedFanType,
    setSelectedFanType,
    data,
    loading,
    fetchMetrics,
    filteredScripts
  };
}
