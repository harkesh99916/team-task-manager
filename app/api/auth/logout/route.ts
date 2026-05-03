import { clearAuthCookie } from "@/lib/auth";
import { handleApiError, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const response = successResponse({ loggedOut: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error, "Unable to log out.");
  }
}
