import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
import { createProjectSchema } from "@/lib/validators/project";
import Project from "@/models/Project";
import Task from "@/models/Task";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const adminError = requireAdmin(auth.user);
    if (adminError) {
      return adminError;
    }

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    const project = await Project.create({
      name: parsed.data.name,
      createdBy: auth.user.id,
      members: []
    });

    const populatedProject = await Project.findById(project._id)
      .populate("members.user", "name email")
      .lean();

    return successResponse(
      {
        project: {
          ...populatedProject,
          _id: project._id.toString(),
          currentUserRole: "admin"
        }
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "Unable to create project.");
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    if (auth.user.role === "member" || auth.user.role === "pending") {
      return successResponse({ projects: [] });
    }

    const query =
      auth.user.role === "admin"
        ? {}
        : auth.user.assignedProject
          ? { _id: auth.user.assignedProject }
          : { _id: null };

    const projects = await Project.find(query)
      .populate("members.user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((project) => project._id);
    const taskCounts = await Task.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          project: { $in: projectIds }
        }
      },
      {
        $group: {
          _id: "$project",
          count: { $sum: 1 }
        }
      }
    ]);

    const taskCountMap = new Map(taskCounts.map((item) => [item._id.toString(), item.count]));

    return successResponse({
      projects: projects.map((project) => ({
        ...project,
        taskCount: taskCountMap.get(project._id.toString()) ?? 0,
        currentUserRole:
          auth.user.role === "admin"
            ? "admin"
            : (project.members.find((member) => member.user._id.toString() === auth.user.id)?.role ??
              auth.user.role)
      }))
    });
  } catch (error) {
    return handleApiError(error, "Unable to load projects.");
  }
}
