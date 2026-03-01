"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
