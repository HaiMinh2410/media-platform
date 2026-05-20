'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.name || 'Anonymous'}]:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-error/5 border border-error/20 rounded-2xl space-y-4 text-center min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand font-bold text-lg">Hệ thống gặp sự cố</h3>
            <p className="text-sm text-foreground-secondary max-w-xs mx-auto">
              Không thể tải dữ liệu {this.props.name || 'này'}. Vui lòng thử lại sau.
            </p>
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-sm btn-outline border-error/30 hover:bg-error hover:border-error text-error hover:text-white gap-2"
          >
            <RefreshCcw size={14} />
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SectionError: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-base-200/50 border border-base-content/5 rounded-2xl space-y-3 text-center min-h-[200px]">
    <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error animate-pulse">
      <AlertTriangle size={20} />
    </div>
    <div className="space-y-1">
      <h3 className="font-brand font-semibold text-base">{title}</h3>
      <p className="text-xs text-foreground-tertiary">
        Dữ liệu tạm thời không khả dụng.
      </p>
    </div>
  </div>
);
