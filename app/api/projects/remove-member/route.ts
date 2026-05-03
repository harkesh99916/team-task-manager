import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { checkProjectAccess, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { removeMemberSchema } from "@/lib/validators/project";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const body = await parseJsonBody(request);
    const parsed = removeMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    if (!isValidObjectId(parsed.data.projectId) || !isValidObjectId(parsed.data.userId)) {
      return errorResponse("Invalid project or user id.", 422);
    }

    const access = await checkProjectAccess(auth.user, parsed.data.projectId, {
      allowAdmin: true,
      allowLeader: true,
      allowMember: false
    });
    if (access.response) {
      return access.response;
    }

    const project = access.project;
    const targetUser = await User.findById(parsed.data.userId);
    if (!targetUser) {
      return errorResponse("User not found.", 404);
    }

    const memberIndex = project.members.findIndex(
      (member) => member.user.toString() === parsed.data.userId
    );

    if (memberIndex === -1) {
      return errorResponse("User is not a member of this project.", 404);
    }

    const member = project.members[memberIndex];

    if (parsed.data.userId === auth.user.id) {
      return errorResponse("You cannot remove your own project assignment here.", 422);
    }

    if (auth.user.role === "leader" && member.role !== "member") {
      return errorResponse("Leaders can only remove project members.", 403);
    }

    const assignedTaskCount = await Task.countDocuments({
      project: project._id,
      assignedTo: parsed.data.userId
    });

    if (assignedTaskCount > 0) {
      return errorResponse(
        "This member still has tasks in the project. Reassign or remove those tasks first.",
        422
      );
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    targetUser.assignedProject = null;
    targetUser.role = "pending";
    await targetUser.save();

    const updatedProject = await Project.findById(project._id)
      .populate("members.user", "name email")
      .lean();

    return successResponse({
      project: {
        ...updatedProject,
        currentUserRole: auth.user.role === "admin" ? "admin" : auth.user.role
      }
    });
  } catch (error) {
    return handleApiError(error, "Unable to remove member.");
  }
}
