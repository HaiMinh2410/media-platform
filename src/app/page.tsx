import Link from "next/link";
import { Button } from "@shared/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 relative overflow-hidden">
      {/* Background radial gradient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] z-0 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center gap-8 max-w-3xl text-center z-10 px-4">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-gradient mb-4">Media Platform</h1>
          <p className="text-lg md:text-xl text-foreground-secondary max-w-xl mx-auto mt-2">The ultimate solution for social media management and AI-powered automation.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link href="/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">Create Account</Button>
          </Link>
        </div>
      </main>
      
      <footer className="p-6 text-foreground-tertiary text-sm z-10">
        <p>&copy; 2026 Media Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
