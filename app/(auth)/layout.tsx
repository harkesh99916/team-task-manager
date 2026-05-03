const demoAccounts = [
  {
    role: "Admin",
    email: "admin@gmail.com",
    password: "Password123!"
  },
  {
    role: "Project Leader",
    email: "leader1@gmail.com",
    password: "Password123!"
  },
  {
    role: "Member",
    email: "member1@gmail.com",
    password: "Password123!"
  }
];

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-mesh-gradient px-6 py-8 sm:px-10 lg:px-14">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[2rem] bg-slate-950 p-10 text-white shadow-soft lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
            Team Task Manager
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">
            Coordinate projects, control access, and keep work moving without losing visibility.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Secure session-based auth, project-level roles, and a task dashboard that helps admins and members focus on the work that matters.
          </p>
          <div className="mt-10 grid gap-4">
            {demoAccounts.map((account) => (
              <div
                key={account.role}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
              >
                <p className="font-semibold text-white">{account.role}</p>
                <p className="mt-2 text-slate-300">Email: {account.email}</p>
                <p className="mt-1 text-slate-300">Password: {account.password}</p>
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
