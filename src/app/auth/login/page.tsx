import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import styles from './login-page.module.css';

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <AuthCard 
        title="Welcome back" 
        subtitle="Sign in to manage your social media channels"
      >
        <LoginForm />
      </AuthCard>
      
      <div className={styles.background}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    </main>
  );
}
