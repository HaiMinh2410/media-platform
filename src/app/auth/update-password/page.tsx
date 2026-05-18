import { AuthCard } from '@/components/auth/auth-card';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';
import styles from '../login/login-page.module.css';

export default function UpdatePasswordPage() {
  return (
    <main className={styles.container}>
      <AuthCard 
        title="Đặt lại mật khẩu" 
        subtitle="Thiết lập mật khẩu mới cho tài khoản của bạn"
      >
        <UpdatePasswordForm />
      </AuthCard>
      
      <div className={styles.background}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    </main>
  );
}
