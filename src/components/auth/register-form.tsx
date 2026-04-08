'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import styles from './login-form.module.css'; // Reusing styles

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('Register:', { fullName, email, password });
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input 
        label="Full Name" 
        type="text" 
        placeholder="John Doe" 
        required 
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
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
      
      <Button type="submit" isLoading={isLoading} className={styles.submit}>
        Create Account
      </Button>
      
      <p className={styles.switch}>
        Already have an account? <Link href="/auth/login" className="text-gradient">Sign in</Link>
      </p>
    </form>
  );
}
