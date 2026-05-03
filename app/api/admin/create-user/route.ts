import bcrypt from "bcryptjs";

import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/access-control";
import { parseJsonBody } from "@/lib/parse-json-body";
import { syncUserProjectAssignment } from "@/lib/user-project-assignment";
import { createUserByAdminSchema } from "@/lib/validators/auth";
import User from "@/models/User";

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
    const parsed = createUserByAdminSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    const existingUser = await User.findOne({ email: parsed.data.email }).select("_id");
    if (existingUser) {
      return errorResponse("A user with that email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: "pending",
      assignedProject: null
    });

    if (parsed.data.role !== "pending" || parsed.data.projectId) {
      await syncUserProjectAssignment({
        userId: user._id.toString(),
        role: parsed.data.role,
        projectId: parsed.data.projectId ?? null
      });
    }

    const createdUser = await User.findById(user._id)
      .select("_id name email role assignedProject")
      .populate("assignedProject", "name")
      .lean();

    return successResponse({ user: createdUser }, 201);
  } catch (error) {
    return handleApiError(error, "Unable to create user.");
  }
}
