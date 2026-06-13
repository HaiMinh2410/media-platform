'use client';

import { Icon, PortalTooltip } from "@shared/ui";

import React, { useState, useRef } from 'react';
import { Key, RefreshCw, CheckCircle2, XCircle, Code, Trash2, HelpCircle, Copy, Check } from 'lucide-react';
import { upsertMetaAccountsFromJsonAction } from '@features/settings/actions/developer.actions';

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
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    results: UpsertResult[];
  } | null>(null);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isHelpActive, setIsHelpActive] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

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

    // Client-side Validation trước khi truyền lên Server
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (e) {
      alert('Dữ liệu dán vào không phải là chuỗi JSON hợp lệ. Vui lòng kiểm tra lại cấu trúc cú pháp!');
      return;
    }

    const accountsArray = Array.isArray(parsedData.data) 
      ? parsedData.data 
      : Array.isArray(parsedData) 
        ? parsedData 
        : null;

    if (!accountsArray || accountsArray.length === 0) {
      alert('Cấu trúc JSON không hợp lệ. Phải chứa mảng "data" hoặc là một mảng danh sách tài khoản.');
      return;
    }

    const hasValidAccount = accountsArray.some((acc: any) => acc && acc.id && acc.access_token && acc.name);
    if (!hasValidAccount) {
      alert('Không tìm thấy tài khoản hợp lệ nào có đủ các trường bắt buộc (id, name, access_token) trong JSON.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgressMessage('Đang kết nối server và xác thực tài khoản song song...');

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
      setProgressMessage('');
    }
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
    <div className="card rounded-xl bg-base-100 border border-base-content/5 p-6 hover:-translate-y-0.5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-base-content flex items-center gap-1.5 leading-tight">
              Cập nhật Token thủ công (JSON Upsert)
              <div
                ref={helpRef}
                onMouseEnter={() => setIsHelpActive(true)}
                onMouseLeave={() => setIsHelpActive(false)}
                className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
              >
                <HelpCircle size={15} />
              </div>
            </h3>
          </div>
        </div>

        <PortalTooltip
          active={isHelpActive}
          anchorRef={helpRef}
          showArrow
          position="bottom"
          align="right"
          className="w-80 p-4 text-sm bg-soft rounded-xl "
        >
          <div className="space-y-2">
            <p className="font-bold text-sm text-primary">Hướng dẫn lấy JSON tài khoản:</p>
            <p className="text-base-content/80">
              1. Truy cập **Facebook Graph API Explorer**.
            </p>
            <p className="text-base-content/80">
              2. Gọi GET endpoint: <code className="bg-base-100 px-1 py-0.5 rounded text-primary">/me/accounts?fields=id,name,access_token,category</code>
            </p>
            <p className="text-base-content/80">
              3. Sao chép toàn bộ kết quả JSON nhận được và dán vào ô bên dưới.
            </p>
          </div>
        </PortalTooltip>
      </div>

      {/* Editor & Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="tracking-wide text-base-content/60">
            Dữ liệu JSON đầu vào
          </span>
          <div className="flex gap-2">
            <button
              onClick={loadExample}
              className="btn btn-xs btn-ghost text-primary text-sm cursor-pointer"
              disabled={isLoading}
            >
              Xem JSON mẫu
            </button>
            <button
              onClick={handlePrettify}
              className="btn btn-xs btn-ghost text-base-content/70 text-sm flex items-center gap-1 cursor-pointer"
              disabled={isLoading || !jsonInput}
            >
              <Code size={12} /> Định dạng JSON
            </button>
            <button
              onClick={handleClear}
              className="btn btn-xs btn-ghost text-error text-sm flex items-center gap-1 cursor-pointer"
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
            className="textarea textarea-bordered w-full min-h-[200px] rounded-lg text-sm font-mono bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 resize-y"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !jsonInput.trim()}
            className="btn btn-primary rounded-md self-start flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Đang đồng bộ hóa dữ liệu...
              </>
            ) : (
              <>
                <RefreshCw size={15} /> Bắt đầu cập nhật Token
              </>
            )}
          </button>
          {isLoading && progressMessage && (
            <div className="text-xs text-base-content/40 flex items-center gap-1.5 animate-pulse">
              <span className="loading loading-dots loading-xs text-primary"></span>
              {progressMessage}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="mt-8 border-t border-base-content/10 pt-6 animate-fadeIn">
          <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
            result.success 
              ? 'bg-success/5 border-success/20 text-success' 
              : 'bg-error/5 border-error/20 text-error'
          }`}>
            {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            <div>
              <h4 className="font-bold text-sm">Kết quả xử lý</h4>
              <p className="text-xs mt-1 text-base-content/70">{result.message}</p>
            </div>
          </div>

          {result.results.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest font-mono text-base-content/40 block mb-2">
                Chi tiết tài khoản xử lý
              </span>
              <div className="overflow-hidden rounded-xl border border-base-content/5 bg-base-200/30">
                <table className="table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-content/5">
                      <th className="p-3 text-xs font-bold text-base-content/70">Tài khoản Facebook</th>
                      <th className="p-3 text-xs font-bold text-base-content/70">Trạng thái</th>
                      <th className="p-3 text-xs font-bold text-base-content/70">Instagram liên kết</th>
                      <th className="p-3 text-xs font-bold text-base-content/70">Phản hồi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item, index) => (
                      <tr key={index} className="border-b border-base-content/5 hover:bg-base-200/20 transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-base-content">{item.name}</span>
                            <span className="text-xs font-mono text-base-content/40 flex items-center gap-1.5 mt-0.5">
                              ID: {item.id}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.id);
                                  setCopiedIndex(index);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="btn btn-ghost btn-xs p-0 min-h-0 h-auto text-base-content/40 hover:text-primary transition-colors cursor-pointer"
                                title="Sao chép ID"
                              >
                                {copiedIndex === index ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                              </button>
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {item.success ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/10">
                              <CheckCircle2 size={12} /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error/10 text-error border border-error/10">
                              <XCircle size={12} /> Thất bại
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.instagramId ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-500 border border-pink-500/10">
                              <Icon name="instagram" size={12} /> IG: {item.instagramId}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-base-content/40">Không tìm thấy</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-medium text-base-content/70">{item.message}</span>
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
