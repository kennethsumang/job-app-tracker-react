import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/** Props for {@link QueryProvider}. */
interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provides a single TanStack Query client for the application.
 *
 * Defaults: 60s stale time and one retry.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
