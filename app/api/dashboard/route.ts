import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/access-control";
import Project from "@/models/Project";
import Task from "@/models/Task";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    let projects: Array<any> = [];
    let taskQuery: Record<string, unknown> = {};

    if (auth.user.role === "admin") {
      projects = await Project.find({})
        .select("_id name members")
        .lean();
      taskQuery = projects.length > 0 ? { project: { $in: projects.map((project) => project._id) } } : {};
    } else if (auth.user.role === "leader") {
      if (auth.user.assignedProject) {
        projects = await Project.find({ _id: auth.user.assignedProject })
          .select("_id name members")
          .lean();
        taskQuery = { project: auth.user.assignedProject };
      }
    } else if (auth.user.role === "member") {
      taskQuery = { assignedTo: auth.user.id };
    }

    const tasks = await Task.find(taskQuery)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const groupedTasks = {
      "To Do": tasks.filter((task) => task.status === "To Do"),
      "In Progress": tasks.filter((task) => task.status === "In Progress"),
      Done: tasks.filter((task) => task.status === "Done")
    };

    const overdueTasks = tasks.filter(
      (task) => task.status !== "Done" && new Date(task.dueDate).getTime() < Date.now()
    );

    return successResponse({
      viewerRole: auth.user.role,
      totals: {
        projects: projects.length,
        tasks: tasks.length,
        assignedToMe: tasks.filter((task) => task.assignedTo._id.toString() === auth.user.id).length,
        overdue: overdueTasks.length
      },
      projects: projects.map((project) => ({
        ...project,
        currentUserRole:
          auth.user.role === "admin"
            ? "admin"
            : project.members.find((member: any) => member.user.toString() === auth.user.id)?.role ??
              auth.user.role
      })),
      groupedTasks,
      overdueTasks
    });
  } catch (error) {
    return handleApiError(error, "Unable to load dashboard data.");
  }
}
