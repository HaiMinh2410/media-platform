'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { ReactNode } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  // NOTE: Avoid templating the query client in the render function.
  // Instead, use getQueryClient() which handles the singleton on the browser.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
