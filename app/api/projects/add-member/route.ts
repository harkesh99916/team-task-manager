import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { syncUserProjectAssignment } from "@/lib/user-project-assignment";
import { addMemberSchema } from "@/lib/validators/project";
import Project from "@/models/Project";

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

    const body = await parseJsonBody(request);
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    if (!isValidObjectId(parsed.data.projectId) || !isValidObjectId(parsed.data.userId)) {
      return errorResponse("Invalid project or user id.", 422);
    }

    await syncUserProjectAssignment({
      userId: parsed.data.userId,
      role: parsed.data.role,
      projectId: parsed.data.projectId
    });

    const updatedProject = await Project.findById(parsed.data.projectId)
      .populate("members.user", "name email")
      .lean();

    return successResponse({
      project: {
        ...updatedProject,
        currentUserRole: "admin"
      }
    });
  } catch (error) {
    return handleApiError(error, "Unable to add member.");
  }
}
