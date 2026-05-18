import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import styles from '../login/login-page.module.css';

export default function ForgotPasswordPage() {
  return (
    <main className={styles.container}>
      <AuthCard 
        title="Quên mật khẩu?" 
        subtitle="Đặt lại mật khẩu cho tài khoản của bạn"
      >
        <ForgotPasswordForm />
      </AuthCard>
      
      <div className={styles.background}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    </main>
  );
}
