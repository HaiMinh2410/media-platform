import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[440px] p-xl rounded-lg flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-5 duration-700 glass">
      <div className="text-center flex flex-col items-center gap-sm">
        <div className="mb-md">
          <div className="w-12 h-12 bg-[var(--accent-gradient)] rounded-md -rotate-[10deg] relative after:content-[''] after:absolute after:inset-1 after:border-2 after:border-white/40 after:rounded-sm"></div>
        </div>
        <h1 className="text-32 text-foreground">{title}</h1>
        <p className="text-foreground-secondary text-base">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-md">
        {children}
      </div>
    </div>
  );
}
