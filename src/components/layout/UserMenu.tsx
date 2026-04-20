"use client";

import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { useUser, useSignOut } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();
  const { user } = useUser();
  const signOut = useSignOut();

  const email = user?.email ?? "";
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const initials = (fullName ?? email).slice(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none cursor-pointer"
      >
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-xs bg-primary/15 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:flex flex-col items-start leading-none">
          {fullName && (
            <span className="text-xs font-medium text-foreground">{fullName}</span>
          )}
          <span className="text-xs text-muted-foreground max-w-[160px] truncate">
            {email}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Identity summary */}
        <div className="px-2 py-2 flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-sm bg-primary/15 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none min-w-0">
            {fullName && (
              <span className="text-xs font-medium text-foreground truncate">{fullName}</span>
            )}
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings />
          Account settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
