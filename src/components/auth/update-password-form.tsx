'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updatePassword } from '@/app/auth/actions';

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải dài ít nhất 6 ký tự.');
      setIsLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('password', password);
      
      const result = await updatePassword(formData);
      
      if (result?.error) {
        let errorMsg = result.error;
        if (result.error.includes('rate limit')) {
          errorMsg = 'Quá nhiều yêu cầu. Vui lòng đợi vài phút trước khi thử lại.';
        }
        setError(errorMsg);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error('[UpdatePasswordForm] error:', err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center flex flex-col gap-sm py-4">
        <div className="bg-status-success/10 border border-status-success text-status-success p-sm rounded-sm text-sm text-center">
          Mật khẩu của bạn đã được cập nhật thành công!
        </div>
        <p className="text-foreground-secondary text-sm mt-sm">
          Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản của mình.
        </p>
        <Button className="w-full mt-md" onClick={() => window.location.href = '/auth/login'}>
          Đi đến Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      <p className="text-foreground-secondary text-sm">
        Nhập mật khẩu mới cho tài khoản của bạn. Đảm bảo mật khẩu an toàn và dễ nhớ.
      </p>
      
      <Input 
        label="Mật khẩu mới" 
        type="password" 
        placeholder="••••••••" 
        required 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Input 
        label="Xác nhận mật khẩu" 
        type="password" 
        placeholder="••••••••" 
        required 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error p-sm rounded-sm text-sm text-center">
          {error}
        </div>
      )}
      
      <Button type="submit" isLoading={isLoading} className="w-full mt-sm">
        Cập nhật mật khẩu mới
      </Button>
    </form>
  );
}
