import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id).select("_id name email role assignedProject");

    if (!user) {
      return errorResponse("User not found.", 404);
    }

    return successResponse({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role ?? "pending",
        assignedProject: user.assignedProject ? user.assignedProject.toString() : null
      }
    });
  } catch (error) {
    return handleApiError(error, "Unable to load the current user.");
  }
}
