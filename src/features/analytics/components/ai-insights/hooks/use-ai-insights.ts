import { useState, useEffect } from 'react';

export function useAIInsights() {
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFanType, setSelectedFanType] = useState<string>('All');
  
  // State chứa toàn bộ dữ liệu từ API
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu thực tế
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-agent/metrics');
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

  useEffect(() => {
    setMounted(true);
    fetchMetrics();
  }, []);

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
    timeRange,
    setTimeRange,
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
