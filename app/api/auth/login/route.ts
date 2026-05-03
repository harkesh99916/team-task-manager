import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { parseJsonBody } from "@/lib/parse-json-body";
import { applyRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rateLimitKey = `login:${request.headers.get("x-forwarded-for") ?? "local"}`;
  const rateLimit = applyRateLimit(rateLimitKey);

  if (rateLimit.limited) {
    return errorResponse("Too many login attempts. Please try again shortly.", 429);
  }

  try {
    const body = await parseJsonBody(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    await connectToDatabase();

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) {
      return errorResponse("Invalid email or password.", 401);
    }

    const matches = await bcrypt.compare(parsed.data.password, user.password);
    if (!matches) {
      return errorResponse("Invalid email or password.", 401);
    }

    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    });

    const response = successResponse({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role ?? "pending",
        assignedProject: user.assignedProject ? user.assignedProject.toString() : null
      }
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error, "Unable to log in.");
  }
}
