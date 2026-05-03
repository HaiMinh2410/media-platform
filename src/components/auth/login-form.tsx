'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { login } from '@/app/auth/actions';

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
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
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
      
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error p-[10px] rounded-sm text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <Link href="/auth/forgot-password" summerized-link="forgot" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
          Forgot password?
        </Link>
      </div>
      
      <Button type="submit" isLoading={isLoading} className="w-full mt-sm">
        Sign In
      </Button>
      
      <p className="text-center text-sm text-foreground-secondary mt-sm">
        Don't have an account? <Link href="/auth/register" className="text-gradient font-semibold">Register</Link>
      </p>
    </form>
  );
}
