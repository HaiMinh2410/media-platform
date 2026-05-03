import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  fullWidth,
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-accent-primary to-accent-secondary text-white border-none hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:-translate-y-px active:translate-y-0',
    secondary: 'bg-background-tertiary text-foreground hover:bg-[#232326]',
    outline: 'bg-transparent border border-white/10 text-foreground hover:bg-white/[0.03] hover:border-foreground-secondary',
    ghost: 'bg-transparent text-foreground-secondary hover:bg-white/[0.03] hover:text-foreground',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };

  const buttonClass = `inline-flex items-center justify-center rounded-md font-semibold cursor-pointer transition-all duration-200 ease-in-out outline-none gap-sm whitespace-nowrap disabled:opacity-60 disabled:filter-none disabled:grayscale disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
  
  return (
    <button className={buttonClass} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="w-[18px] h-[18px] border-2 border-white/30 rounded-full border-t-white animate-spin"></span>
      ) : children}
    </button>
  );
}
