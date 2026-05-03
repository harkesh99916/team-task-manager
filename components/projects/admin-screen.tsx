"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Save, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type ProjectRecord = {
  _id: string;
  name: string;
  currentUserRole: "admin" | "leader" | "member";
  members: Array<unknown>;
  taskCount: number;
};

type AdminUserRecord = {
  _id: string;
  name: string;
  email: string;
  role: "pending" | "admin" | "leader" | "member";
  assignedProject: {
    _id: string;
    name: string;
  } | null;
};

type ProjectOption = {
  _id: string;
  name: string;
};

export function AdminScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "pending" as AdminUserRecord["role"],
    projectId: ""
  });
  const [drafts, setDrafts] = useState<
    Record<string, { role: AdminUserRecord["role"]; projectId: string }>
  >({});

  async function loadAdminData() {
    try {
      const [projectData, userData] = await Promise.all([
        apiRequest<{ projects: ProjectRecord[] }>("/api/projects"),
        apiRequest<{ users: AdminUserRecord[]; projects: ProjectOption[] }>("/api/admin/users")
      ]);

      setProjects(projectData.projects);
      setUsers(userData.users);
      setProjectOptions(userData.projects);
      setDrafts(
        Object.fromEntries(
          userData.users.map((entry) => [
            entry._id,
            {
              role: entry.role,
              projectId: entry.assignedProject?._id ?? ""
            }
          ])
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);

    try {
      await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: projectName })
      });

      toast.success("Project created.");
      setProjectName("");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create project.");
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(userId: string) {
    const draft = drafts[userId];
    if (!draft) {
      return;
    }

    setSavingUserId(userId);

    try {
      await apiRequest("/api/admin/update-user", {
        method: "PUT",
        body: JSON.stringify({
          userId,
          role: draft.role,
          projectId: draft.projectId || null
        })
      });

      toast.success("User updated.");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingUser(true);

    try {
      await apiRequest("/api/admin/create-user", {
        method: "POST",
        body: JSON.stringify({
          ...newUserForm,
          projectId:
            newUserForm.role === "admin" || newUserForm.role === "pending"
              ? null
              : newUserForm.projectId || null
        })
      });

      toast.success("User created.");
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        role: "pending",
        projectId: ""
      });
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user.");
    } finally {
      setCreatingUser(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Admin access required"
        description="Only administrators can manage projects, roles, and project assignments."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.85fr_0.85fr_1.3fr]">
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-950 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">Create a project</CardTitle>
                <CardDescription className="text-white/70">
                  Only admins can create new projects and assign leaders or members.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={createProject}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Project name</label>
                <Input
                  placeholder="Q3 Product Launch"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <Spinner />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create project
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-950 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">Create a user</CardTitle>
                <CardDescription className="text-white/70">
                  Admins can create accounts directly and assign access immediately.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={createUser}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <Input
                  value={newUserForm.name}
                  onChange={(event) =>
                    setNewUserForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ava Johnson"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={newUserForm.email}
                  onChange={(event) =>
                    setNewUserForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Temporary password</label>
                <Input
                  type="password"
                  value={newUserForm.password}
                  onChange={(event) =>
                    setNewUserForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <Select
                    value={newUserForm.role}
                    onChange={(event) =>
                      setNewUserForm((current) => ({
                        ...current,
                        role: event.target.value as AdminUserRecord["role"],
                        projectId:
                          event.target.value === "admin" || event.target.value === "pending"
                            ? ""
                            : current.projectId
                      }))
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="admin">Admin</option>
                    <option value="leader">Project Leader</option>
                    <option value="member">Member</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Assigned project</label>
                  <Select
                    value={newUserForm.projectId}
                    disabled={newUserForm.role === "admin" || newUserForm.role === "pending"}
                    onChange={(event) =>
                      setNewUserForm((current) => ({ ...current, projectId: event.target.value }))
                    }
                  >
                    <option value="">No project</option>
                    {projectOptions.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creatingUser}>
                {creatingUser ? (
                  <Spinner />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create user
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project overview</CardTitle>
            <CardDescription>
              A quick view of each project&apos;s current headcount and task volume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Create your first project to start assigning leaders, members, and work."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}`}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    <h3 className="font-semibold text-slate-950">{project.name}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Members</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{project.members.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tasks</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{project.taskCount ?? 0}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">Open project workspace</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Members table</CardTitle>
            <CardDescription>
              Update user roles and project assignments from one admin-controlled table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <EmptyState
                title="No users yet"
                description="New signups will appear here with a pending role until an admin assigns access."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <th className="pb-4 pr-4 font-medium">Name</th>
                      <th className="pb-4 pr-4 font-medium">Email</th>
                      <th className="pb-4 pr-4 font-medium">Role</th>
                      <th className="pb-4 pr-4 font-medium">Assigned project</th>
                      <th className="pb-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((entry) => {
                      const draft = drafts[entry._id];

                      return (
                        <tr key={entry._id} className="border-b border-slate-100 align-top">
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-slate-950">{entry.name}</p>
                          </td>
                          <td className="py-4 pr-4 text-sm text-slate-600">{entry.email}</td>
                          <td className="py-4 pr-4">
                            <Select
                              value={draft?.role ?? entry.role}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [entry._id]: {
                                    role: event.target.value as AdminUserRecord["role"],
                                    projectId:
                                      event.target.value === "admin" || event.target.value === "pending"
                                        ? ""
                                        : current[entry._id]?.projectId ?? entry.assignedProject?._id ?? ""
                                  }
                                }))
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="admin">Admin</option>
                              <option value="leader">Project Leader</option>
                              <option value="member">Member</option>
                            </Select>
                          </td>
                          <td className="py-4 pr-4">
                            <Select
                              value={draft?.projectId ?? entry.assignedProject?._id ?? ""}
                              disabled={draft?.role === "admin" || draft?.role === "pending"}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [entry._id]: {
                                    role: current[entry._id]?.role ?? entry.role,
                                    projectId: event.target.value
                                  }
                                }))
                              }
                            >
                              <option value="">No project</option>
                              {projectOptions.map((project) => (
                                <option key={project._id} value={project._id}>
                                  {project.name}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="py-4">
                            <Button
                              variant="outline"
                              onClick={() => void updateUser(entry._id)}
                              disabled={savingUserId === entry._id}
                            >
                              {savingUserId === entry._id ? (
                                <Spinner />
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
