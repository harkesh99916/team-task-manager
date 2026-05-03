import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { checkProjectAccess, requireAdmin, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { updateMemberRoleSchema } from "@/lib/validators/project";
import Project from "@/models/Project";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const access = await checkProjectAccess(auth.user, params.id, {
      allowAdmin: true,
      allowLeader: true,
      allowMember: false
    });
    if (access.response) {
      return access.response;
    }

    const project = await Project.findById(params.id)
      .populate("members.user", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (!project) {
      return errorResponse("Project not found.", 404);
    }

    const currentUserMember = project.members.find(
      (member) => member.user._id.toString() === auth.user.id
    );

    return successResponse({
      project: {
        ...project,
        currentUserRole: auth.user.role === "admin" ? "admin" : currentUserMember?.role ?? "member"
      }
    });
  } catch (error) {
    return handleApiError(error, "Unable to load project.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const adminError = requireAdmin(auth.user);
    if (adminError) {
      return adminError;
    }

    if (!isValidObjectId(params.id)) {
      return errorResponse("Invalid project id.", 422);
    }

    const body = await parseJsonBody(request);
    const parsed = updateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    if (!isValidObjectId(parsed.data.userId)) {
      return errorResponse("Invalid user id.", 422);
    }

    const project = await Project.findById(params.id);
    if (!project) {
      return errorResponse("Project not found.", 404);
    }

    const member = project.members.find((entry) => entry.user.toString() === parsed.data.userId);

    if (!member) {
      return errorResponse("Project member not found.", 404);
    }

    if (
      parsed.data.role === "leader" &&
      project.members.some(
        (entry) => entry.role === "leader" && entry.user.toString() !== parsed.data.userId
      )
    ) {
      return errorResponse("This project already has a leader assigned.", 422);
    }

    const user = await User.findById(parsed.data.userId);
    if (!user || user.assignedProject?.toString() !== params.id) {
      return errorResponse("User is not assigned to this project.", 422);
    }

    member.role = parsed.data.role;
    await project.save();
    user.role = parsed.data.role;
    await user.save();

    const updatedProject = await Project.findById(project._id)
      .populate("members.user", "name email")
      .populate("createdBy", "name email")
      .lean();

    return successResponse({
      project: {
        ...updatedProject,
        currentUserRole: "admin"
      }
    });
  } catch (error) {
    return handleApiError(error, "Unable to update member role.");
  }
}
