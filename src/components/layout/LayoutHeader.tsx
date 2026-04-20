"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { useNavigation } from "@/lib/navigation/context";
import { cn } from "@/lib/utils";

export function LayoutHeader() {
  const { pending } = useNavigation();

  return (
    <>
      {/* Top progress bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-[2px] z-50 bg-primary transition-opacity duration-300",
          pending ? "opacity-100" : "opacity-0"
        )}
        style={pending ? { animation: "nav-progress 2s ease-in-out infinite" } : undefined}
      />
      <style>{`
        @keyframes nav-progress {
          0%   { transform: scaleX(0); transform-origin: left; }
          50%  { transform: scaleX(0.7); transform-origin: left; }
          100% { transform: scaleX(0.9); transform-origin: left; }
        }
      `}</style>

      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 z-30">
        <Link href="/projects" className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          <span className="font-semibold text-sm">SeatRight</span>
        </Link>
        <div className="flex items-center gap-1">
          {pending && (
            <svg
              className="h-4 w-4 animate-spin text-primary mr-1"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          <ThemeToggle />
          <div className="w-px h-4 bg-border mx-1" />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
