"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { apiRequest } from "@/lib/fetcher";
import { formatDate, isOverdue } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type UserRecord = {
  _id: string;
  name: string;
  email: string;
};

type ProjectRecord = {
  _id: string;
  name: string;
  currentUserRole: "admin" | "leader" | "member";
  members: Array<{
    user: UserRecord;
    role: "leader" | "member";
  }>;
};

type TaskRecord = {
  _id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "Done";
  dueDate: string;
  project: {
    _id: string;
    name: string;
  };
  assignedTo: UserRecord;
  canEdit: boolean;
  canDelete: boolean;
};

export function ProjectScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    status: "To Do"
  });

  const canCreateTask =
    project?.currentUserRole === "admin" || project?.currentUserRole === "leader";
  const canManageMembers =
    project?.currentUserRole === "admin" || project?.currentUserRole === "leader";

  async function loadProjectData() {
    try {
      const [projectData, taskData] = await Promise.all([
        apiRequest<{ project: ProjectRecord }>(`/api/projects/${projectId}`),
        apiRequest<{ tasks: TaskRecord[] }>(`/api/tasks?projectId=${projectId}`)
      ]);

      setProject(projectData.project);
      setTasks(taskData.tasks);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjectData();
  }, [projectId]);

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...taskForm,
          projectId
        })
      });

      toast.success("Task created.");
      setCreateTaskOpen(false);
      setTaskForm({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        status: "To Do"
      });
      await loadProjectData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskRecord["status"]) {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadProjectData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update task.");
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      toast.success("Task deleted.");
      await loadProjectData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete task.");
    }
  }

  async function removeMember(userId: string) {
    try {
      await apiRequest("/api/projects/remove-member", {
        method: "DELETE",
        body: JSON.stringify({ projectId, userId })
      });
      toast.success("Member removed.");
      await loadProjectData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove member.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project unavailable"
        description="This project could not be loaded or you do not have access to it."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-950 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-white">{project.name}</CardTitle>
                <CardDescription className="text-white/70">
                  Members, responsibilities, and project-wide delivery status.
                </CardDescription>
              </div>
              <Badge variant={project.currentUserRole === "admin" ? "primary" : "neutral"}>
                {project.currentUserRole}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Members</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{project.members.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Tasks</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{tasks.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {tasks.filter((task) => isOverdue(task.dueDate, task.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace actions</CardTitle>
            <CardDescription>
              Admins and project leaders can manage delivery inside this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-center"
              variant="default"
              onClick={() => setCreateTaskOpen(true)}
              disabled={!canCreateTask}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create task
            </Button>
            {!canManageMembers ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                You can update only tasks assigned to you. Project management is limited to admins and project leaders.
              </p>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Project assignments are controlled from the admin panel. Leaders can still remove members from this workspace when needed.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Leader and member visibility for this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.members.map((member) => (
                <div
                  key={member.user._id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Avatar name={member.user.name} email={member.user.email} />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Badge variant={member.role === "leader" ? "primary" : "neutral"}>
                        {member.role}
                      </Badge>
                      {canManageMembers && member.role === "member" ? (
                        <Button variant="ghost" onClick={() => void removeMember(member.user._id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Project work items and ownership status.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Create the first task to get this project moving."
              />
            ) : (
              <div className="w-full max-w-full overflow-hidden">
                <div className="w-full space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="break-words text-lg font-semibold text-slate-950">
                              {task.title}
                            </h3>
                            <Badge
                              variant={
                                task.status === "Done"
                                  ? "success"
                                  : task.status === "In Progress"
                                    ? "primary"
                                    : "warning"
                              }
                            >
                              {task.status}
                            </Badge>
                            {isOverdue(task.dueDate, task.status) ? (
                              <Badge variant="danger">Overdue</Badge>
                            ) : null}
                          </div>
                          <p className="max-w-2xl break-words text-sm leading-6 text-slate-600">
                            {task.description || "No additional task details provided."}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <CalendarClock className="h-4 w-4" />
                              Due {formatDate(task.dueDate)}
                            </span>
                            <span>Assigned to {task.assignedTo.name}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                          {task.canEdit ? (
                            <Select
                              value={task.status}
                              onChange={(event) =>
                                void updateTaskStatus(
                                  task._id,
                                  event.target.value as TaskRecord["status"]
                                )
                              }
                              className="min-w-[180px]"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </Select>
                          ) : (
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                              Read only
                            </div>
                          )}
                          {task.canDelete ? (
                            <Button variant="outline" onClick={() => void deleteTask(task._id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Modal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        title="Create task"
        description="Assign work to a leader or member in this project."
      >
        <form className="space-y-4" onSubmit={handleCreateTask}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Assigned to</label>
              <Select
                value={taskForm.assignedTo}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))
                }
                required
              >
                <option value="">Select a member</option>
                {project.members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Due date</label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, dueDate: event.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select
              value={taskForm.status}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  status: event.target.value as TaskRecord["status"]
                }))
              }
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : "Create task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
