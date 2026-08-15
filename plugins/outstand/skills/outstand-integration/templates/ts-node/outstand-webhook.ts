/**
 * Outstand webhook handler (Express-style; adapt the route wiring to your framework).
 *
 * Handles `post.published` and `post.error`. Note the shapes differ deliberately:
 *  - `post.published` fires when AT LEAST ONE account succeeded — its `socialAccounts` entries
 *    can still mix successes and failures (partial success). Each entry has `platformPostId`/
 *    `platformPostUrl` when it succeeded, and no `error`.
 *  - `post.error` fires only when EVERY account failed. Its `socialAccounts` entries have `error`
 *    and no `platformPostId`.
 *
 * Never treat receiving `post.published` as "the whole post went out everywhere" — iterate
 * `socialAccounts` and persist each one's outcome individually.
 *
 * Also handles `account.token_expired` so a stale connection surfaces instead of silently
 * failing every subsequent post to that account.
 *
 * Verifies `X-Outstand-Signature` (HMAC-SHA256 over the raw body) if you configured a signing
 * secret for this webhook in the Outstand dashboard — strongly recommended in production.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

interface PublishedAccount {
  accountId: string;
  network: string;
  username: string;
  platformPostId: string;
  platformPostUrl: string;
}

interface FailedAccount {
  accountId: string;
  network: string;
  username: string;
  error: string;
}

type OutstandWebhookEvent =
  | { event: "post.published"; timestamp: string; data: { postId: string; orgId: string; socialAccounts: PublishedAccount[] } }
  | { event: "post.error"; timestamp: string; data: { postId: string; orgId: string; socialAccounts: FailedAccount[] } }
  | {
      event: "account.token_expired";
      timestamp: string;
      data: { orgId: string; accountId: string | number; network: string; username: string; error: string };
    }
  | { event: "import.completed" | "import.failed"; timestamp: string; data: Record<string, unknown> };

function verifySignature(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * IMPORTANT: this route needs the raw request body for signature verification — mount it with
 * `express.raw({ type: "application/json" })` (or your framework's equivalent) rather than a
 * JSON body parser that's already consumed/reserialized the payload.
 */
export async function handleOutstandWebhook(req: Request, res: Response) {
  const rawBody = req.body as Buffer; // requires raw body middleware, see note above
  const secret = process.env.OUTSTAND_WEBHOOK_SECRET;

  if (secret) {
    const ok = verifySignature(rawBody.toString("utf8"), req.header("x-outstand-signature"), secret);
    if (!ok) {
      res.status(401).send("Invalid signature");
      return;
    }
  }

  const event = JSON.parse(rawBody.toString("utf8")) as OutstandWebhookEvent;

  switch (event.event) {
    case "post.published": {
      // Partial success: some accounts here may still represent a subset of the target list —
      // this event only lists accounts that succeeded. Update just those rows.
      for (const account of event.data.socialAccounts) {
        await upsertPostAccountStatus({
          outstandPostId: event.data.postId,
          outstandAccountId: account.accountId,
          status: "published",
          platformPostId: account.platformPostId,
          platformPostUrl: account.platformPostUrl,
          error: null,
        });
      }
      break;
    }
    case "post.error": {
      for (const account of event.data.socialAccounts) {
        await upsertPostAccountStatus({
          outstandPostId: event.data.postId,
          outstandAccountId: account.accountId,
          status: "failed",
          platformPostId: null,
          platformPostUrl: null,
          error: account.error,
        });
      }
      break;
    }
    case "account.token_expired": {
      await markAccountNeedsReauth(String(event.data.accountId), event.data.error);
      break;
    }
    default:
      // import.completed / import.failed — wire up if you use post import.
      break;
  }

  res.status(200).send("OK");
}

// --- Replace these with your actual persistence layer -----------------------------------

async function upsertPostAccountStatus(_args: {
  outstandPostId: string;
  outstandAccountId: string;
  status: "published" | "failed";
  platformPostId: string | null;
  platformPostUrl: string | null;
  error: string | null;
}): Promise<void> {
  throw new Error("TODO: implement using your ORM (see outstand-schema.prisma for the shape)");
}

async function markAccountNeedsReauth(_outstandAccountId: string, _error: string): Promise<void> {
  throw new Error("TODO: flag the account row so your UI can prompt reconnection");
}
