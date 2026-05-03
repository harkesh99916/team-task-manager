import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

const quickLoginAccounts = [
  { role: "Admin", email: "admin@gmail.com" },
  { role: "Leader", email: "leader1@gmail.com" },
  { role: "Member", email: "member1@gmail.com" }
];

export default function LoginPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Welcome back</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Log in to your workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in with your account to access projects, assigned tasks, and admin controls.
        </p>
      </div>
      <AuthForm mode="login" nextPath={searchParams?.next} />
      
      <p className="mt-6 text-sm text-slate-600">
        Need an account?{" "}
        <Link href="/signup" className="font-semibold text-slate-950 hover:text-sky-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
