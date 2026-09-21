import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactNode } from "react";

/** A fresh QueryClient per render so no cache leaks between tests. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  queryClient: QueryClient = createTestQueryClient(),
): RenderResult {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
