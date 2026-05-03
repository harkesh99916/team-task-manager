import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
import Project from "@/models/Project";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const adminError = requireAdmin(auth.user);
    if (adminError) {
      return adminError;
    }

    const [users, projects] = await Promise.all([
      User.find({})
        .select("_id name email role assignedProject")
        .populate("assignedProject", "name")
        .sort({ createdAt: -1 })
        .lean(),
      Project.find({})
        .select("_id name")
        .sort({ name: 1 })
        .lean()
    ]);

    return successResponse({ users, projects });
  } catch (error) {
    return handleApiError(error, "Unable to load admin user data.");
  }
}
