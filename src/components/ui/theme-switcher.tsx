'use client';

import { useEffect, useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';

const themes = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter",
  "dim", "nord", "sunset", "caramellatte", "abyss", "silk"
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    // Initialize theme from localStorage or document attribute
    const savedTheme = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'dark';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  };

  return (
    <div className="dropdown dropdown-bottom dropdown-end">

      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-sm md:btn-md flex items-center gap-2 px-3 border border-foreground/5 hover:border-foreground/20 bg-foreground/5 backdrop-blur-md transition-all duration-300 rounded-xl"
      >
        <div className="p-1 rounded-lg bg-primary/20">
          <Palette className="h-4 w-4 text-primary" />
        </div>
        <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider opacity-80">Theme</span>
        <ChevronDown className="h-3 w-3 opacity-40 group-focus:rotate-180 transition-transform" />
      </div>
      
      <ul 
        tabIndex={0} 
        className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-200/95 backdrop-blur-xl rounded-2xl w-64 max-h-[70vh] overflow-y-auto flex-nowrap border border-foreground/10 mt-2 gap-1 animate-in fade-in zoom-in duration-200"
      >
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          Select Visual Identity
        </div>
        
        {themes.map((theme) => (
          <li key={theme} className="group">
            <button
              data-set-theme={theme}
              onClick={() => handleThemeChange(theme)}
              className={`
                flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-200
                ${currentTheme === theme ? 'bg-primary/10 text-primary' : 'hover:bg-base-300'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div 
                    className="w-4 h-4 rounded-full border border-foreground/10" 
                    data-theme={theme}
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  {currentTheme === theme && (
                    <Check className="absolute h-2.5 w-2.5 text-primary-content" />
                  )}
                </div>
                <span className="capitalize text-sm font-medium tracking-tight">{theme}</span>
              </div>

              {/* Theme Preview Colors */}
              <div className="flex gap-0.5 p-1 rounded-lg bg-base-300/50" data-theme={theme}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-primary)' }} title="Primary" />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-secondary)' }} title="Secondary" />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-accent)' }} title="Accent" />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-neutral)' }} title="Neutral" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
