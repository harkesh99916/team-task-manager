import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { checkProjectAccess, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { updateTaskSchema } from "@/lib/validators/task";
import Task from "@/models/Task";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    if (!isValidObjectId(params.id)) {
      return errorResponse("Invalid task id.", 422);
    }

    const body = await parseJsonBody(request);
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    const task = await Task.findById(params.id);
    if (!task) {
      return errorResponse("Task not found.", 404);
    }

    const access = await checkProjectAccess(auth.user, task.project.toString(), {
      allowAdmin: true,
      allowLeader: true,
      allowMember: true
    });
    if (access.response) {
      return access.response;
    }

    const isAdmin = auth.user.role === "admin";
    const isLeader = auth.user.role === "leader";
    const isAssignedUser = task.assignedTo.toString() === auth.user.id;

    if (!isAdmin && !isLeader && !isAssignedUser) {
      return errorResponse("Forbidden", 403);
    }

    if (!isAdmin && !isLeader) {
      const memberAllowedFields = ["status"];
      const attemptedPrivilegedUpdate = Object.keys(parsed.data).some(
        (key) => !memberAllowedFields.includes(key)
      );

      if (attemptedPrivilegedUpdate) {
        return errorResponse("Members can only update task status.", 403);
      }
    }

    if (parsed.data.assignedTo) {
      if (!isValidObjectId(parsed.data.assignedTo)) {
        return errorResponse("Invalid assigned user id.", 422);
      }

      if (!isAdmin && !isLeader) {
        return errorResponse("Only admins and project leaders can reassign tasks.", 403);
      }

      const assignedUser = await User.findById(parsed.data.assignedTo).select(
        "_id role assignedProject"
      );

      if (
        !assignedUser ||
        !assignedUser.assignedProject ||
        assignedUser.assignedProject.toString() !== task.project.toString() ||
        !["leader", "member"].includes(assignedUser.role ?? "")
      ) {
        return errorResponse("Assigned user must be part of the selected project.", 422);
      }

      task.assignedTo = parsed.data.assignedTo as never;
    }

    if (parsed.data.title !== undefined) {
      task.title = parsed.data.title;
    }

    if (parsed.data.description !== undefined) {
      task.description = parsed.data.description;
    }

    if (parsed.data.status !== undefined) {
      task.status = parsed.data.status;
    }

    if (parsed.data.dueDate !== undefined) {
      task.dueDate = parsed.data.dueDate;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .lean();

    return successResponse({ task: populatedTask });
  } catch (error) {
    return handleApiError(error, "Unable to update task.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    if (auth.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    if (!isValidObjectId(params.id)) {
      return errorResponse("Invalid task id.", 422);
    }

    const task = await Task.findById(params.id);
    if (!task) {
      return errorResponse("Task not found.", 404);
    }

    await task.deleteOne();
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, "Unable to delete task.");
  }
}
