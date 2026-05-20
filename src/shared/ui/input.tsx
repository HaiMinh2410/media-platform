import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-xs w-full ${className}`}>
      {label && <label className="text-sm font-medium text-foreground-secondary ml-1">{label}</label>}
      <input 
        className={`w-full px-md py-3 bg-background-secondary border border-foreground/10 rounded-md text-foreground outline-none transition-all duration-200 focus:border-accent-primary focus:bg-background-tertiary focus:ring-4 focus:ring-accent-primary/10 ${error ? 'border-status-error' : ''}`} 
        {...props} 
      />
      {error && <p className="text-xs text-status-error ml-1">{error}</p>}
    </div>
  );
}
