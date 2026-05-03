const WINDOW_MS = 60 * 1000;
const LIMIT = 20;

type Entry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, Entry>();

export function applyRateLimit(identifier: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS
    });
    return { limited: false, remaining: LIMIT - 1 };
  }

  if (entry.count >= LIMIT) {
    return { limited: true, remaining: 0 };
  }

  entry.count += 1;
  rateLimitStore.set(identifier, entry);
  return { limited: false, remaining: LIMIT - entry.count };
}
