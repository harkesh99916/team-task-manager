function getParseCandidates(rawBody: string) {
  const trimmed = rawBody.trim();
  const candidates = [trimmed];

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsedString = JSON.parse(trimmed);

      if (typeof parsedString === "string") {
        candidates.push(parsedString);
      }
    } catch {
      // Fall through to the escaped JSON candidate below.
    }
  }

  if (trimmed.includes('\\"')) {
    candidates.push(trimmed.replace(/\\"/g, '"'));
  }

  return [...new Set(candidates)];
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  const rawBody = await request.text();

  for (const candidate of getParseCandidates(rawBody)) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try the next candidate shape.
    }
  }

  throw new SyntaxError("Invalid JSON request body");
}
