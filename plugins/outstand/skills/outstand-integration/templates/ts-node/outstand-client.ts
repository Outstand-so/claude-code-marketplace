/**
 * Outstand API client.
 *
 * Encodes the three rules that generic HTTP retry logic gets wrong for this API:
 *  - 402 (subscription_inactive) is NEVER retryable — retrying only wastes calls until the
 *    subscription is reactivated in billing.
 *  - 429 IS retryable, honoring `Retry-After` when present. EXCEPT the "request quota exhausted"
 *    variant, which needs the quota raised, not a retry.
 *  - Rate limits are dynamic per-org — pace off `X-RateLimit-Remaining`, never hardcode a limit.
 *
 * Adjust the base URL / auth source to match your config setup; this file assumes an
 * `OUTSTAND_API_KEY` env var. Confirm field names/paths against the live docs before shipping —
 * this was generated against the docs fetched during this session.
 */

const BASE_URL = "https://api.outstand.so";

export class OutstandApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "OutstandApiError";
  }

  /** 402 subscription_inactive, and quota-exhausted 429s, never succeed by retrying. */
  get retryable(): boolean {
    if (this.status === 402) return false;
    if (this.status === 429) return this.code !== "quota_exhausted";
    return this.status >= 500;
  }
}

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const num = (name: string) => {
    const v = headers.get(name);
    return v === null ? null : Number(v);
  };
  const resetSeconds = num("x-ratelimit-reset");
  return {
    limit: num("x-ratelimit-limit"),
    remaining: num("x-ratelimit-remaining"),
    resetAt: resetSeconds === null ? null : new Date(resetSeconds * 1000),
  };
}

export class OutstandClient {
  constructor(
    private readonly apiKey: string = process.env.OUTSTAND_API_KEY ?? "",
    private readonly baseUrl: string = BASE_URL,
  ) {
    if (!this.apiKey) {
      throw new Error("OUTSTAND_API_KEY is not set");
    }
  }

  /** Last-seen rate limit snapshot; use this to pace request volume instead of a hardcoded cap. */
  lastRateLimit: RateLimitInfo | null = null;

  async request<T>(
    path: string,
    init: RequestInit = {},
    { retries = 2 }: { retries?: number } = {},
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    this.lastRateLimit = parseRateLimit(res.headers);

    if (res.ok) {
      // Some endpoints (e.g. media PUT) may return no body.
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }

    const body = await res.json().catch(() => undefined);
    const code = typeof body === "object" && body && "code" in body ? String((body as any).code) : undefined;
    const error = new OutstandApiError(
      (body as any)?.error ?? `Outstand API error (${res.status})`,
      res.status,
      code,
      body,
    );

    if (error.retryable && retries > 0) {
      const retryAfterHeader = res.headers.get("retry-after");
      const waitMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 500 * (3 - retries);
      await new Promise((r) => setTimeout(r, waitMs));
      return this.request<T>(path, init, { retries: retries - 1 });
    }

    throw error;
  }

  // --- Social accounts -------------------------------------------------

  listSocialAccounts() {
    return this.request<{ success: true; data: unknown[] }>("/v1/social-accounts");
  }

  /** Bluesky connects via app password, not the OAuth redirect. */
  connectBluesky(handle: string, appPassword: string) {
    return this.request("/v1/social-accounts/bluesky", {
      method: "POST",
      body: JSON.stringify({ handle, app_password: appPassword }),
    });
  }

  // --- Posts -------------------------------------------------------------

  /**
   * Creates (and, if `scheduledAt` is omitted, immediately queues) a post.
   * A 200 here means "accepted and durably queued" — NOT "live on every platform."
   * Poll `getPost` or (preferred) handle the `post.published` / `post.error` webhooks
   * to learn the real per-account outcome.
   *
   * Pass `idempotencyKey` (a UUID v4) on any call that might be retried by your own code
   * (client timeout, queue redelivery) — Outstand replays the original response instead of
   * creating a second post when the same key + body is sent again within 24h.
   */
  createPost(
    params: {
      content?: string;
      containers?: Array<{ content: string; media?: Array<{ url: string; filename: string; altText?: string }> }>;
      accounts: string[];
      scheduledAt?: string; // ISO 8601, max 30 days out
    },
    idempotencyKey?: string,
  ) {
    return this.request<{
      success: true;
      warnings?: string[];
      post: {
        id: string;
        publishedAt: string | null;
        scheduledAt: string | null;
        isDraft: boolean;
        socialAccounts: Array<{
          network: string;
          username?: string;
          status: "pending" | "published" | "failed" | "deleted";
          platformPostId: string | null;
          platformPostUrl: string | null;
          error: string | null;
          publishedAt: string | null;
        }>;
      };
    }>("/v1/posts", {
      method: "POST",
      body: JSON.stringify(params),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  }

  getPost(postId: string) {
    return this.request<{
      success: true;
      post: {
        id: string;
        publishedAt: string | null;
        socialAccounts: Array<{
          id: string;
          network: string;
          status: "pending" | "published" | "failed" | "deleted";
          platformPostId: string | null;
          platformPostUrl: string | null;
          error: string | null;
          publishedAt: string | null;
        }>;
      };
    }>(`/v1/posts/${postId}`);
  }

  // --- Media ---------------------------------------------------------------

  requestMediaUpload(filename: string, contentType?: string) {
    return this.request<{ success: true; data: { id: string; upload_url: string; expires_in: number } }>(
      "/v1/media/upload",
      { method: "POST", body: JSON.stringify({ filename, content_type: contentType }) },
    );
  }

  /** Call only after the PUT to `upload_url` has succeeded — Outstand verifies storage first. */
  confirmMediaUpload(mediaId: string, size?: number) {
    return this.request<{ success: true; data: { id: string; url: string; status: string; expires_at: string } }>(
      `/v1/media/${mediaId}/confirm`,
      { method: "POST", body: JSON.stringify(size ? { size } : {}) },
    );
  }
}
