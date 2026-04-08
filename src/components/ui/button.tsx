import React from 'react';
import styles from './button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  return (
    <button className={buttonClass} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className={styles.spinner}></span>
      ) : children}
    </button>
  );
}
