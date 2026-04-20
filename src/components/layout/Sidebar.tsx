"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar absolute left-0 top-0 z-20 flex h-full w-14 hover:w-56 flex-col border-r bg-sidebar border-sidebar-border transition-[width] duration-200 overflow-hidden">
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 delay-75">
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
