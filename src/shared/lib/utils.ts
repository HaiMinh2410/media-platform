import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatChatSeparator(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const isSameDay = d.toDateString() === now.toDateString();
  
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay) {
    return timeStr;
  }
  
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[d.getDay()];
  
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${timeStr} ${dayName}`;
  }
  
  return `${timeStr} ${dayName}, ${d.getDate()}/${d.getMonth() + 1}`;
}
