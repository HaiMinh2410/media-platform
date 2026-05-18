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
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const result = await login(formData);
      
      if (result?.error) {
        let errorMsg = result.error;
        if (result.error === 'Invalid login credentials') {
          errorMsg = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        } else if (result.error.includes('Email not confirmed')) {
          errorMsg = 'Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư của bạn.';
        } else if (result.error.includes('rate limit')) {
          errorMsg = 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.';
        }
        setError(errorMsg);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('NEXT_REDIRECT')) {
        throw err;
      }
      console.error('[LoginForm] error:', err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
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
        <div className="bg-status-error/10 border border-status-error text-status-error p-sm rounded-sm text-sm text-center">
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
