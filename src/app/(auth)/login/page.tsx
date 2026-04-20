"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { GoogleOAuthButton } from "@/components/auth/OAuthButtons";
import { cn } from "@/lib/utils";

type Tab = "email" | "magic";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-sm">
            S
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">SeatRight</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Board governance intelligence platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b bg-muted/40">
            {(["email", "magic"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  tab === t
                    ? "bg-card text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {t === "email" ? "Email & Password" : "Magic Link"}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-6 space-y-5">
            {tab === "email" ? <LoginForm /> : <MagicLinkForm />}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <GoogleOAuthButton />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </div>
  );
}
