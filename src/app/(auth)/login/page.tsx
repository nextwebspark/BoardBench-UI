"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { GoogleOAuthButton } from "@/components/auth/OAuthButtons";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Users,
  Award,
  type LucideProps,
} from "lucide-react";

type Tab = "email" | "magic";

type Slide = {
  icon: string;
  headline: string;
  description: string;
  stat: string;
  statLabel: string;
};

const SLIDES: Slide[] = [
  {
    icon: "LayoutDashboard",
    headline: "Board Composition Intelligence",
    description:
      "Know the full makeup of any board at a glance — tenure, expertise clusters, committee assignments, and key relationships.",
    stat: "500+",
    statLabel: "companies indexed",
  },
  {
    icon: "BarChart3",
    headline: "Peer Benchmarking",
    description:
      "Compare your board's composition against 15 hand-picked industry peers instantly, with a single normalized score.",
    stat: "15×",
    statLabel: "faster than manual research",
  },
  {
    icon: "ShieldCheck",
    headline: "Independence Analysis",
    description:
      "Track independent director ratios against NYSE, NASDAQ, and FCA thresholds. Stay compliant before regulators knock.",
    stat: "99%",
    statLabel: "regulatory rule coverage",
  },
  {
    icon: "Users",
    headline: "Diversity Insights",
    description:
      "Measure gender and professional diversity against sector benchmarks. Go beyond disclosure and into actionable gaps.",
    stat: "40+",
    statLabel: "diversity dimensions tracked",
  },
  {
    icon: "Award",
    headline: "Governance Score",
    description:
      "A composite score across independence, diversity, tenure, expertise, and ESG engagement — updated with every filing.",
    stat: "5",
    statLabel: "governance dimensions",
  },
];

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Users,
  Award,
};

function SlideIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon {...props} />;
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("email");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="flex-1 lg:flex-none lg:w-[42%] flex items-center justify-center bg-background px-6 py-12 lg:py-0">
        <div className="w-full max-w-sm space-y-8">

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

      {/* ── RIGHT PANEL ── */}
      <div className="hidden lg:flex lg:flex-none lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 items-center justify-center">

        {/* Dot texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-primary-foreground) 1.5px, transparent 1.5px)`,
            backgroundSize: "28px 28px",
            opacity: 0.07,
          }}
        />

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

        {/* Floating metric cards */}
        <div className="absolute top-14 left-10 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/25 -rotate-3 animate-in fade-in slide-in-from-left duration-700 delay-200 fill-mode-both">
          <p className="text-[10px] text-primary-foreground/65 font-semibold uppercase tracking-widest mb-1">Board Size</p>
          <p className="text-3xl font-bold text-primary-foreground leading-none">9</p>
          <p className="text-[10px] text-primary-foreground/55 mt-1">directors</p>
        </div>

        <div className="absolute top-20 right-10 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/25 rotate-2 animate-in fade-in slide-in-from-right duration-700 delay-400 fill-mode-both">
          <p className="text-[10px] text-primary-foreground/65 font-semibold uppercase tracking-widest mb-1">Independence</p>
          <p className="text-3xl font-bold text-primary-foreground leading-none">78%</p>
          <p className="text-[10px] text-primary-foreground/55 mt-1">P72 vs peers</p>
        </div>

        <div className="absolute bottom-24 left-12 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/25 rotate-3 animate-in fade-in slide-in-from-bottom duration-700 delay-150 fill-mode-both">
          <p className="text-[10px] text-primary-foreground/65 font-semibold uppercase tracking-widest mb-1">Gender Diversity</p>
          <p className="text-3xl font-bold text-primary-foreground leading-none">42%</p>
          <p className="text-[10px] text-primary-foreground/55 mt-1">female directors</p>
        </div>

        <div className="absolute bottom-32 right-8 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/25 -rotate-2 animate-in fade-in slide-in-from-bottom duration-700 delay-350 fill-mode-both">
          <p className="text-[10px] text-primary-foreground/65 font-semibold uppercase tracking-widest mb-1">Gov. Score</p>
          <p className="text-3xl font-bold text-primary-foreground leading-none">87</p>
          <p className="text-[10px] text-primary-foreground/55 mt-1">out of 100</p>
        </div>

        {/* Central slide content */}
        <div className="relative z-10 max-w-sm text-center px-10 space-y-7">

          {/* Icon */}
          <div
            className={cn(
              "mx-auto w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30",
              "flex items-center justify-center shadow-2xl",
              "transition-all duration-300 ease-in-out",
              isTransitioning ? "opacity-0 scale-90" : "opacity-100 scale-100"
            )}
          >
            <SlideIcon
              name={SLIDES[currentSlide].icon}
              className="w-9 h-9 text-primary-foreground"
              strokeWidth={1.75}
            />
          </div>

          {/* Text */}
          <div
            className={cn(
              "space-y-4 transition-all duration-300 ease-in-out",
              isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
            )}
          >
            <h2 className="text-2xl font-bold text-primary-foreground leading-tight tracking-tight">
              {SLIDES[currentSlide].headline}
            </h2>
            <p className="text-sm text-primary-foreground/75 leading-relaxed">
              {SLIDES[currentSlide].description}
            </p>

            {/* Stat badge */}
            <div className="inline-flex items-baseline gap-2 bg-white/15 rounded-full px-5 py-2 border border-white/25 backdrop-blur-sm">
              <span className="text-xl font-bold text-primary-foreground">
                {SLIDES[currentSlide].stat}
              </span>
              <span className="text-xs text-primary-foreground/70">
                {SLIDES[currentSlide].statLabel}
              </span>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  idx === currentSlide
                    ? "w-6 h-2 bg-primary-foreground"
                    : "w-2 h-2 bg-primary-foreground/35 hover:bg-primary-foreground/60"
                )}
              />
            ))}
          </div>
        </div>

        {/* Wordmark */}
        <div className="absolute bottom-5 right-6 text-[10px] text-primary-foreground/35 font-semibold tracking-[0.2em] uppercase">
          SeatRight
        </div>
      </div>

    </div>
  );
}
