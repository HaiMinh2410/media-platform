'use client';

import { useState } from 'react';
import { Key, Play, CheckCircle2, XCircle, Code, Trash2, ChevronRight, Copy, Check } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { upsertMetaAccountsFromJsonAction } from '@/application/actions/developer.actions';

interface UpsertResult {
  id: string;
  name: string;
  success: boolean;
  message: string;
  instagramId?: string | null;
}

export function MetaTokenUpserter() {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    results: UpsertResult[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handlePrettify = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert('Dữ liệu dán vào không phải là JSON hợp lệ để định dạng!');
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      alert('Vui lòng dán dữ liệu JSON tài khoản!');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await upsertMetaAccountsFromJsonAction(jsonInput);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Lỗi hệ thống khi cập nhật token',
        results: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = (token: string, index: number) => {
    navigator.clipboard.writeText(token);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const loadExample = () => {
    const example = {
      "data": [
        {
          "access_token": "EAAOKRPPOur8BRe...",
          "category": "Người sáng tạo nội dung số",
          "name": "Hai Minh Platform",
          "id": "1006289889245664"
        },
        {
          "access_token": "EAAOKRPPOur8BRQ...",
          "category": "Người sáng tạo nội dung số",
          "name": "Kathryn",
          "id": "1155246160994859"
        }
      ]
    };
    setJsonInput(JSON.stringify(example, null, 2));
  };

  return (
    <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Key size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Cập nhật Token thủ công (JSON Upsert)
          </h3>
          <p className="text-foreground-secondary text-xs font-semibold">
            Dán danh sách token/tài khoản lấy từ Facebook Pages API để cập nhật nhanh chóng
          </p>
        </div>
      </div>

      <p className="text-foreground-tertiary text-sm leading-relaxed mb-6">
        Công cụ này cho phép bạn dán trực tiếp kết quả JSON trả về từ Graph API Explorer (ví dụ endpoint <code>/me/accounts</code>). 
        Hệ thống sẽ tự động phân tích lấy các trường tương ứng (<code>id</code>, <code>name</code>, <code>access_token</code>, <code>category</code>), 
        mã hóa an toàn mã truy cập, tự động truy vấn tìm tài khoản Instagram liên kết và cập nhật/thêm mới vào cơ sở dữ liệu.
      </p>

      {/* Editor & Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
            Dữ liệu JSON đầu vào
          </span>
          <div className="flex gap-2">
            <button
              onClick={loadExample}
              className="btn btn-xs btn-ghost text-primary text-xs font-bold"
              disabled={isLoading}
            >
              Xem JSON mẫu
            </button>
            <button
              onClick={handlePrettify}
              className="btn btn-xs btn-ghost text-foreground-secondary text-xs font-bold flex items-center gap-1"
              disabled={isLoading || !jsonInput}
            >
              <Code size={12} /> Định dạng JSON
            </button>
            <button
              onClick={handleClear}
              className="btn btn-xs btn-ghost text-error text-xs font-bold flex items-center gap-1"
              disabled={isLoading || !jsonInput}
            >
              <Trash2 size={12} /> Xóa trống
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Dán JSON tại đây... Ví dụ:&#10;{&#10;  "data": [&#10;    {&#10;      "access_token": "EAAOKRPP...",&#10;      "category": "Người sáng tạo nội dung số",&#10;      "name": "Hai Minh Platform",&#10;      "id": "1006289889245664"&#10;    }&#10;  ]&#10;}'
            rows={8}
            className="w-full p-4 rounded-xl font-mono text-xs bg-foreground/[0.03] border border-foreground/10 text-foreground placeholder:text-foreground-tertiary/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !jsonInput.trim()}
          className="btn btn-primary text-white font-bold self-start flex items-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Đang đồng bộ hóa dữ liệu...
            </>
          ) : (
            <>
              <Play size={15} /> Bắt đầu cập nhật Token
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="mt-8 border-t border-foreground/10 pt-6 animate-fadeIn">
          <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
            result.success 
              ? 'bg-success/5 border-success/20 text-success' 
              : 'bg-error/5 border-error/20 text-error'
          }`}>
            {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            <div>
              <h4 className="font-bold text-sm">Kết quả xử lý</h4>
              <p className="text-xs mt-1 text-foreground-secondary">{result.message}</p>
            </div>
          </div>

          {result.results.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider block mb-2">
                Chi tiết tài khoản xử lý
              </span>
              <div className="overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.01]">
                <table className="table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-foreground/[0.02] border-b border-foreground/10">
                      <th className="p-3 text-xs font-bold text-foreground-secondary">Tài khoản Facebook</th>
                      <th className="p-3 text-xs font-bold text-foreground-secondary">Trạng thái</th>
                      <th className="p-3 text-xs font-bold text-foreground-secondary">Instagram liên kết</th>
                      <th className="p-3 text-xs font-bold text-foreground-secondary">Phản hồi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item, index) => (
                      <tr key={index} className="border-b border-foreground/5 hover:bg-foreground/[0.01] transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{item.name}</span>
                            <span className="text-xs font-mono text-foreground-tertiary">ID: {item.id}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {item.success ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success/10 text-success">
                              <CheckCircle2 size={12} /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error/10 text-error">
                              <XCircle size={12} /> Thất bại
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.instagramId ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                              <Icon name="instagram" size={12} /> IG: {item.instagramId}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-foreground-tertiary">Không tìm thấy</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-medium text-foreground-secondary">{item.message}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
