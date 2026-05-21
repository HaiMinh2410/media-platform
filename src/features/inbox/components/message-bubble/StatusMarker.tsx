import React from 'react';
import { Loader2, CheckCheck, Check } from 'lucide-react';

interface StatusMarkerProps {
  isRead?: boolean;
  isDelivered?: boolean;
  isSending?: boolean;
}

export function StatusMarker({
  isRead,
  isDelivered,
  isSending,
}: StatusMarkerProps) {
  if (isSending) {
    return <Loader2 size={12} className="animate-spin text-foreground-tertiary" />;
  }
  if (isRead) {
    return <CheckCheck size={12} className="text-emerald-500 font-bold animate-pulse" />;
  }
  if (isDelivered) {
    return <CheckCheck size={12} className="text-foreground-tertiary" />;
  }
  return <Check size={12} className="text-foreground-tertiary" />;
}
export default StatusMarker;
