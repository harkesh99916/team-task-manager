import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { parseJsonBody } from "@/lib/parse-json-body";
import { applyRateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validators/auth";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rateLimitKey = `signup:${request.headers.get("x-forwarded-for") ?? "local"}`;
  const rateLimit = applyRateLimit(rateLimitKey);

  if (rateLimit.limited) {
    return errorResponse("Too many signup attempts. Please try again shortly.", 429);
  }

  try {
    const body = await parseJsonBody(request);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid request", 422);
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: parsed.data.email });
    if (existingUser) {
      return errorResponse("A user with that email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      ...parsed.data,
      password: hashedPassword,
      role: "pending",
      assignedProject: null
    });

    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    });

    const response = successResponse(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          assignedProject: null
        }
      },
      201
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error, "Unable to create account.");
  }
}
