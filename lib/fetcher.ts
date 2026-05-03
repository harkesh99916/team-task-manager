type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export async function apiRequest<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  const text = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (text) {
    const normalizedText = text.trimStart();

    if (normalizedText.startsWith("<!DOCTYPE")) {
      throw new Error("Wrong endpoint: received HTML instead of JSON");
    }

    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      console.error("Invalid JSON response:", text);
      throw new Error(
        response.ok
          ? "The server returned an invalid JSON response."
          : `Request failed with status ${response.status}.`
      );
    }
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Request failed" : payload.message);
  }

  return payload.data;
}
