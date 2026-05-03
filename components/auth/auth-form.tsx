"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { AuthUser } from "@/types";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest<{ user: AuthUser }>(
        mode === "login" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? {
                  email: form.email,
                  password: form.password
                }
              : form
          )
        }
      );

      setUser(data.user);
      toast.success(mode === "login" ? "Welcome back." : "Account created successfully.");
      router.push(safeNextPath);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {mode === "signup" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <Input
            placeholder="Ava Johnson"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <Input
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Password</label>
        <Input
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          required
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Spinner /> : mode === "login" ? "Log in" : "Create account"}
      </Button>
    </form>
  );
}
