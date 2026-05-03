import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { checkProjectAccess, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { createTaskSchema } from "@/lib/validators/task";
import Task from "@/models/Task";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    if (auth.user.role !== "admin" && auth.user.role !== "leader") {
      return errorResponse("Forbidden", 403);
    }

    const body = await parseJsonBody(request);
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    if (!isValidObjectId(parsed.data.projectId) || !isValidObjectId(parsed.data.assignedTo)) {
      return errorResponse("Invalid project or assigned user id.", 422);
    }

    const access = await checkProjectAccess(auth.user, parsed.data.projectId, {
      allowAdmin: true,
      allowLeader: true,
      allowMember: false
    });
    if (access.response) {
      return access.response;
    }

    const assignedUser = await User.findById(parsed.data.assignedTo).select(
      "_id role assignedProject"
    );

    if (
      !assignedUser ||
      !assignedUser.assignedProject ||
      assignedUser.assignedProject.toString() !== parsed.data.projectId ||
      !["leader", "member"].includes(assignedUser.role ?? "")
    ) {
      return errorResponse("Assigned user must be part of the selected project.", 422);
    }

    const task = await Task.create({
      title: parsed.data.title,
      description: parsed.data.description,
      project: parsed.data.projectId,
      assignedTo: parsed.data.assignedTo,
      dueDate: parsed.data.dueDate,
      status: parsed.data.status
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .lean();

    return successResponse({ task: populatedTask }, 201);
  } catch (error) {
    return handleApiError(error, "Unable to create task.");
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let query: Record<string, unknown> = {};

    if (auth.user.role === "admin") {
      if (projectId) {
        if (!isValidObjectId(projectId)) {
          return errorResponse("Invalid project id.", 422);
        }
        query.project = projectId;
      }
    } else if (auth.user.role === "leader") {
      if (!auth.user.assignedProject) {
        return successResponse({ tasks: [] });
      }

      if (projectId && projectId !== auth.user.assignedProject) {
        return errorResponse("Forbidden", 403);
      }

      query.project = auth.user.assignedProject;
    } else if (auth.user.role === "member") {
      query.assignedTo = auth.user.id;

      if (projectId) {
        if (!auth.user.assignedProject || projectId !== auth.user.assignedProject) {
          return errorResponse("Forbidden", 403);
        }
        query.project = projectId;
      }
    } else {
      return successResponse({ tasks: [] });
    }

    const tasks = await Task.find(query)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return successResponse({
      tasks: tasks.map((task) => ({
        ...task,
        canEdit:
          auth.user.role === "admin" ||
          (auth.user.role === "leader" && task.project._id.toString() === auth.user.assignedProject) ||
          task.assignedTo._id.toString() === auth.user.id,
        canDelete: auth.user.role === "admin"
      }))
    });
  } catch (error) {
    return handleApiError(error, "Unable to load tasks.");
  }
}
