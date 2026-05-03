"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { KeyRound, LayoutDashboard, LogOut, Menu, Settings2, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });

  const initialsName = useMemo(() => user?.name ?? "Loading", [user?.name]);
  const navigation = useMemo(
    () =>
      [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard
        },
        user?.role === "admin"
          ? {
              href: "/admin",
              label: "Admin Panel",
              icon: Settings2
            }
          : null
      ].filter(Boolean) as Array<{
        href: string;
        label: string;
        icon: typeof LayoutDashboard;
      }>,
    [user?.role]
  );

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);

    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(passwordForm)
      });

      toast.success("Password updated.");
      setPasswordForm({
        currentPassword: "",
        newPassword: ""
      });
      setChangePasswordOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-80 border-r border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
                Team Task Manager
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Workspace</h2>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-[1.75rem] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Secure access</p>
            <p className="mt-3 text-sm leading-6 text-white/80">
              JWT sessions, role-based permissions, and protected routes are active across the app.
            </p>
          </div>

          <div className="mt-auto pt-10">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading your profile...</p>
              ) : user ? (
                <Avatar name={initialsName} email={user.email} />
              ) : (
                <p className="text-sm text-slate-500">No active session</p>
              )}
              <Button
                variant="outline"
                className="mt-4 w-full justify-center"
                onClick={() => setChangePasswordOpen(true)}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Change password
              </Button>
              <Button
                variant="outline"
                className="mt-3 w-full justify-center"
                onClick={() => void logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        {open ? (
          <div
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-50/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden lg:block">
                <p className="text-sm text-slate-500">Collaborative project execution</p>
                <h1 className="text-lg font-semibold text-slate-950">Team task workspace</h1>
              </div>
              {user ? <Avatar name={user.name} email={user.email} /> : <div />}
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>

      <Modal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Change password"
        description="Update your password for this account."
      >
        <form className="space-y-4" onSubmit={handleChangePassword}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Current password</label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">New password</label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value
                }))
              }
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setChangePasswordOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? <Spinner /> : "Update password"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
