'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { forgotPassword } from '@/app/auth/actions';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const result = await forgotPassword(formData);
      
      if (result?.error) {
        let errorMsg = result.error;
        if (result.error.includes('rate limit')) {
          errorMsg = 'Quá nhiều yêu cầu. Vui lòng đợi vài phút trước khi gửi lại.';
        } else if (result.error.includes('User not found')) {
          errorMsg = 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.';
        }
        setError(errorMsg);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error('[ForgotPasswordForm] error:', err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center flex flex-col gap-sm py-4">
        <div className="bg-status-success/10 border border-status-success text-status-success p-sm rounded-sm text-sm text-center">
          Một liên kết đặt lại mật khẩu đã được gửi đến email <strong>{email}</strong>.
        </div>
        <p className="text-foreground-secondary text-sm mt-sm">
          Vui lòng kiểm tra hộp thư đến (hoặc thư rác) của bạn và làm theo hướng dẫn.
        </p>
        <Button className="w-full mt-md" onClick={() => window.location.href = '/auth/login'}>
          Quay lại Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      <p className="text-foreground-secondary text-sm">
        Nhập địa chỉ email của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu mới.
      </p>
      
      <Input 
        label="Email" 
        type="email" 
        placeholder="name@example.com" 
        required 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error p-sm rounded-sm text-sm text-center">
          {error}
        </div>
      )}
      
      <Button type="submit" isLoading={isLoading} className="w-full mt-sm">
        Gửi liên kết đặt lại mật khẩu
      </Button>
      
      <p className="text-center text-sm text-foreground-secondary mt-sm">
        Nhớ ra mật khẩu? <Link href="/auth/login" className="text-gradient font-semibold">Đăng nhập</Link>
      </p>
    </form>
  );
}
