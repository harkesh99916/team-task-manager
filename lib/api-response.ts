import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function handleApiError(error: unknown, fallbackMessage = "Internal server error") {
  console.error(fallbackMessage, error);
  return errorResponse(fallbackMessage, 500);
}
