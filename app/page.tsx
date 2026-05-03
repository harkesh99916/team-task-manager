import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Users, Workflow } from "lucide-react";

import { getAuthenticatedUser } from "@/lib/auth";

const highlights = [
  {
    title: "Project-level RBAC",
    description: "Keep permissions scoped to each project so admins and members stay clearly separated.",
    icon: ShieldCheck
  },
  {
    title: "Clean team workflows",
    description: "Assign ownership, monitor overdue work, and manage task progress without friction.",
    icon: Workflow
  },
  {
    title: "Built for collaboration",
    description: "Bring everyone into the same workspace with project membership, role control, and visibility.",
    icon: Users
  }
];

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-14">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
              Team Task Manager
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create account
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              Production-ready Next.js + MongoDB starter
            </span>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Manage cross-functional work with project-level control and task clarity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Team Task Manager combines secure authentication, scoped permissions, and a realistic SaaS dashboard so teams can create projects, assign tasks, and ship work with confidence.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore the dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-white/60">Projects</p>
                  <p className="mt-2 text-3xl font-bold">12</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-white/60">Open Tasks</p>
                  <p className="mt-2 text-3xl font-bold">37</p>
                </div>
                <div className="rounded-2xl bg-emerald-400/20 p-4">
                  <p className="text-sm text-emerald-100">On Track</p>
                  <p className="mt-2 text-3xl font-bold">84%</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
