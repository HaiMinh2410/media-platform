import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import styles from '../login/login-page.module.css'; // Reusing page layout styles

export default function RegisterPage() {
  return (
    <main className={styles.container}>
      <AuthCard 
        title="Join us" 
        subtitle="Start managing your presence across platforms"
      >
        <RegisterForm />
      </AuthCard>
      
      <div className={styles.background}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    </main>
  );
}
