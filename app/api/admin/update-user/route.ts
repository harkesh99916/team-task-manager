import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
import { isValidObjectId } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/parse-json-body";
import { syncUserProjectAssignment } from "@/lib/user-project-assignment";
import { updateUserAssignmentSchema } from "@/lib/validators/admin";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
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
    const parsed = updateUserAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    if (!isValidObjectId(parsed.data.userId)) {
      return errorResponse("Invalid user id.", 422);
    }

    if (parsed.data.projectId && !isValidObjectId(parsed.data.projectId)) {
      return errorResponse("Invalid project id.", 422);
    }

    await syncUserProjectAssignment({
      userId: parsed.data.userId,
      role: parsed.data.role,
      projectId: parsed.data.projectId ?? null
    });

    const updatedUser = await User.findById(parsed.data.userId)
      .select("_id name email role assignedProject")
      .populate("assignedProject", "name")
      .lean();

    return successResponse({ user: updatedUser });
  } catch (error) {
    return handleApiError(error, "Unable to update user assignment.");
  }
}
