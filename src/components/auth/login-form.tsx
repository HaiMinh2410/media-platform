'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { login } from '@/app/auth/actions';
import styles from './login-form.module.css';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input 
        label="Email" 
        type="email" 
        placeholder="name@example.com" 
        required 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input 
        label="Password" 
        type="password" 
        placeholder="••••••••" 
        required 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      {error && <div className={styles.errorBanner}>{error}</div>}
      
      <div className={styles.footer}>
        <Link href="/auth/forgot-password" className={styles.forgot}>
          Forgot password?
        </Link>
      </div>
      
      <Button type="submit" isLoading={isLoading} className={styles.submit}>
        Sign In
      </Button>
      
      <p className={styles.switch}>
        Don't have an account? <Link href="/auth/register" className="text-gradient">Register</Link>
      </p>
    </form>
  );
}
