"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationContextValue {
  pending: boolean;
  navigateTo: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  pending: false,
  navigateTo: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const targetRef = useRef<string | null>(null);

  const navigateTo = useCallback(
    (href: string) => {
      if (targetRef.current === href) return;
      targetRef.current = href;
      setPending(true);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    // pathname changed — navigation complete
    if (pending) {
      setPending(false);
      targetRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ pending, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
