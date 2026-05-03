import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
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

    const users = await User.find({})
      .select("_id name email role assignedProject")
      .sort({ name: 1 })
      .lean();

    return successResponse({ users });
  } catch (error) {
    return handleApiError(error, "Unable to load users.");
  }
}
