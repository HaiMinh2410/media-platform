import Link from "next/link";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className="text-gradient">Media Platform</h1>
          <p>The ultimate solution for social media management and AI-powered automation.</p>
        </div>
        
        <div className={styles.ctas}>
          <Link href="/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">Create Account</Button>
          </Link>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; 2026 Media Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
