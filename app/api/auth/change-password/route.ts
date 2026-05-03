import bcrypt from "bcryptjs";

import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/access-control";
import { parseJsonBody } from "@/lib/parse-json-body";
import { changePasswordSchema } from "@/lib/validators/auth";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) {
      return auth.response;
    }

    const body = await parseJsonBody(request);
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    const user = await User.findById(auth.user.id).select("_id password");
    if (!user) {
      return errorResponse("User not found.", 404);
    }

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) {
      return errorResponse("Current password is incorrect.", 401);
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();

    return successResponse({ changed: true });
  } catch (error) {
    return handleApiError(error, "Unable to change password.");
  }
}
