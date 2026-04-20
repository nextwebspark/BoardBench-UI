"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-auth";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { user, loading } = useUser();
  const supabase = createClient();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name ?? "");
    }
  }, [user]);

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "U";
  const hasPasswordIdentity = user?.identities?.some((i) => i.provider === "email");

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSavingProfile(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  if (loading) {
    return (
      <>
        <TopBar title="Account settings" />
        <div className="flex-1 p-6">
          <div className="max-w-2xl space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Account settings" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">

          {/* Profile */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSave}>
              <CardContent className="pt-5 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg bg-primary/15 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{fullName || email}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>

                {/* Full name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="sm" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Security</CardTitle>
              <CardDescription>
                {hasPasswordIdentity
                  ? "Change your account password."
                  : "You signed in with Google. Password login is not enabled for this account."}
              </CardDescription>
            </CardHeader>
            {hasPasswordIdentity ? (
              <form onSubmit={handlePasswordChange}>
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingPassword || !newPassword || !confirmPassword}
                  >
                    {savingPassword ? "Updating…" : "Update password"}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">
                  To enable password login, sign out and use the email &amp; password option on the
                  login page.
                </p>
              </CardContent>
            )}
          </Card>

        </div>
      </div>
    </>
  );
}
