"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlarmClockCheck, FolderKanban, ListTodo, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/fetcher";
import { formatDate, isOverdue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";

type DashboardData = {
  viewerRole: "pending" | "admin" | "leader" | "member";
  totals: {
    projects: number;
    tasks: number;
    assignedToMe: number;
    overdue: number;
  };
  projects: Array<{
    _id: string;
    name: string;
    currentUserRole: "admin" | "leader" | "member";
  }>;
  groupedTasks: Record<string, Array<any>>;
  overdueTasks: Array<any>;
};

const statCards = [
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "tasks", label: "Total tasks", icon: ListTodo },
  { key: "assignedToMe", label: "Assigned to me", icon: Sparkles },
  { key: "overdue", label: "Overdue", icon: AlarmClockCheck }
] as const;

function statusVariant(status: string) {
  if (status === "Done") {
    return "success";
  }
  if (status === "In Progress") {
    return "primary";
  }
  return "warning";
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function loadDashboard() {
    try {
      const response = await apiRequest<DashboardData>("/api/dashboard");
      setData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="We could not load your dashboard right now."
      />
    );
  }

  return (
    <div className="space-y-8">
      {data.viewerRole === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>Account pending approval</CardTitle>
            <CardDescription>
              Your account is ready, but an admin still needs to assign your role and project before you can start collaborating.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          const value = data.totals[item.key];

          return (
            <Card key={item.key}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-950">{value}</h2>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {data.viewerRole !== "member" ? (
          <Card>
            <CardHeader>
              <CardTitle>{data.viewerRole === "admin" ? "Projects" : "Assigned project"}</CardTitle>
              <CardDescription>
                {data.viewerRole === "admin"
                  ? "Workspaces you can access right now."
                  : "Your project workspace and current delivery surface."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="Create or assign a project to start coordinating tasks."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.projects.map((project) => (
                    <Link
                      key={project._id}
                      href={`/projects/${project._id}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-950">{project.name}</h3>
                        <Badge variant={project.currentUserRole === "admin" ? "primary" : "neutral"}>
                          {project.currentUserRole}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {data.viewerRole === "admin"
                          ? "Open the project to manage leaders, members, and task delivery."
                          : "Open the project to create tasks, manage members, and track progress."}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Member workspace</CardTitle>
              <CardDescription>Members focus on execution and task progress updates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm leading-6 text-slate-600">
                  {user?.name}, this dashboard is intentionally task-first. You can view your assigned tasks and keep their status current without exposing broader project controls.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
            <CardDescription>Items that need attention before they slip further.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.overdueTasks.length === 0 ? (
              <EmptyState
                title="Nothing overdue"
                description="You're in good shape. Due dates are currently under control."
              />
            ) : (
              <div className="space-y-4">
                {data.overdueTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[1.4rem] border border-rose-200 bg-rose-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-950">{task.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">{task.project.name}</p>
                      </div>
                      <Badge variant="danger">{task.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-rose-700">Due {formatDate(task.dueDate)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Task pipeline</CardTitle>
            <CardDescription>
              {data.viewerRole === "member"
                ? "Your assigned tasks grouped by status."
                : "Tasks grouped by current status across your accessible scope."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-3">
              {Object.entries(data.groupedTasks).map(([status, tasks]) => (
                <div
                  key={status}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">{status}</h3>
                      <p className="text-sm text-slate-500">{tasks.length} tasks</p>
                    </div>
                    <Badge variant={statusVariant(status) as never}>{status}</Badge>
                  </div>
                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                        No tasks in this column yet.
                      </div>
                    ) : (
                      tasks.slice(0, 6).map((task) => {
                        const card = (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-semibold text-slate-950">{task.title}</h4>
                              {isOverdue(task.dueDate, task.status) ? (
                                <Badge variant="danger">Overdue</Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{task.project.name}</p>
                            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                              Due {formatDate(task.dueDate)}
                            </p>
                          </div>
                        );

                        return data.viewerRole === "member" ? (
                          <div key={task._id}>{card}</div>
                        ) : (
                          <Link key={task._id} href={`/projects/${task.project._id}`}>
                            {card}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
