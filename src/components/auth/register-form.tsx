'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signup } from '@/app/auth/actions';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    
    const result = await signup(formData);
    
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center flex flex-col gap-sm py-4">
        <h3 className="text-xl font-bold">Check your email</h3>
        <p className="text-foreground-secondary">We've sent a confirmation link to <strong>{email}</strong>.</p>
        <Button className="w-full mt-md" onClick={() => window.location.href = '/auth/login'}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
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
      
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error p-[10px] rounded-sm text-sm text-center">
          {error}
        </div>
      )}
      
      <Button type="submit" isLoading={isLoading} className="w-full mt-sm">
        Create Account
      </Button>
      
      <p className="text-center text-sm text-foreground-secondary mt-sm">
        Already have an account? <Link href="/auth/login" className="text-gradient font-semibold">Sign in</Link>
      </p>
    </form>
  );
}
