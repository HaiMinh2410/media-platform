import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Lead, LeadStage } from './types';

interface LeadsTableProps {
  leads: Lead[];
  stages: LeadStage[];
}

export function LeadsTable({ leads, stages }: LeadsTableProps) {
  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl overflow-hidden shadow-xs w-full animate-fade-in">
      <div className="overflow-x-auto w-full">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="border-b border-base-content/5 text-base-content/40 font-mono text-xs uppercase tracking-widest font-bold bg-base-200/20">
              <th className="w-12 text-center">
                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded" />
              </th>
              <th>Ngày thêm</th>
              <th>Tên khách hàng</th>
              <th>Giai đoạn</th>
              <th>Nguồn</th>
              <th>Chỉ định</th>
              <th>Kênh</th>
              <th className="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-base-200/20 transition-colors border-b border-base-content/5">
                <td className="text-center">
                  <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded" />
                </td>
                <td className="font-mono text-xs text-base-content/60 font-bold">{lead.date}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="w-9 h-9 rounded-full bg-linear-to-tr from-primary/10 to-secondary/15 text-base-content flex items-center justify-center font-bold text-xs border border-base-content/5">
                        {lead.avatar ? (
                          <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{lead.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-base-content font-brand">{lead.name}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className={cn(
                      "badge badge-sm font-bold uppercase tracking-wider px-2.5 py-1.5 border-0 rounded-md",
                      lead.stage === 'new' ? "badge-info bg-info/10 text-info" : "badge-success bg-success/10 text-success"
                    )}
                  >
                    {stages.find(s => s.id === lead.stage)?.label}
                  </span>
                </td>
                <td className="text-xs font-black uppercase tracking-wider text-base-content/70">{lead.source}</td>
                <td className="text-xs text-base-content/40 italic font-semibold">Chưa chỉ định</td>
                <td>
                  {lead.platform === 'instagram' && (
                    <span className="badge badge-sm font-black bg-instagram/10 text-instagram border-0 rounded-full px-2.5">Instagram</span>
                  )}
                  {lead.platform === 'messenger' && (
                    <span className="badge badge-sm font-black bg-messenger/10 text-messenger border-0 rounded-full px-2.5">Messenger</span>
                  )}
                  {lead.platform === 'unknown' && (
                    <span className="badge badge-sm font-black bg-base-200 text-base-content/50 border-0 rounded-full px-2.5">Trực tiếp</span>
                  )}
                </td>
                <td className="text-right">
                  <button className="btn btn-xs btn-ghost btn-square rounded-lg hover:bg-base-200">
                    <MoreHorizontal size={14} className="opacity-60" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
