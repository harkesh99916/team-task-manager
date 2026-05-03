import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Get started</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Launch a project, invite members, and manage tasks with scoped permissions from day one.
        </p>
      </div>
      <AuthForm mode="signup" nextPath={searchParams?.next} />
      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-950 hover:text-sky-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
