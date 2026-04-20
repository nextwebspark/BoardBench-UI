"use client";

import { DataCacheProvider } from "./context";

export function DataCacheWrapper({ children }: { children: React.ReactNode }) {
  return <DataCacheProvider>{children}</DataCacheProvider>;
}
