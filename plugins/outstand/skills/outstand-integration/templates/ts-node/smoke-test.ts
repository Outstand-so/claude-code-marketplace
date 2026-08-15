/**
 * Smoke test: publish one post to one account and poll until it reaches a terminal state.
 *
 * Run with: OUTSTAND_API_KEY=... npx tsx smoke-test.ts <accountNetworkOrUsername> "post text"
 *
 * This is a manual verification tool, not a unit test — it makes a real API call against your
 * real connected account. Point it at a test/sandbox account if you have one.
 */

import { OutstandClient } from "./outstand-client";

async function main() {
  const [account, text] = process.argv.slice(2);
  if (!account || !text) {
    console.error('Usage: smoke-test.ts <accountNetworkOrUsername> "post text"');
    process.exit(1);
  }

  const client = new OutstandClient();

  console.log(`Publishing to "${account}"...`);
  const { post } = await client.createPost(
    { content: text, accounts: [account] },
    crypto.randomUUID(), // idempotency key — safe to re-run this exact script invocation
  );
  console.log(`Post accepted: id=${post.id}. This means QUEUED, not yet published.`);

  const terminal = new Set(["published", "failed", "deleted"]);
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const { post: current } = await client.getPost(post.id);
    const allTerminal = current.socialAccounts.every((a) => terminal.has(a.status));

    console.log(
      current.socialAccounts
        .map((a) => `  ${a.network}: ${a.status}${a.error ? ` (${a.error})` : ""}`)
        .join("\n"),
    );

    if (allTerminal) {
      const anyPublished = current.socialAccounts.some((a) => a.status === "published");
      console.log(anyPublished ? "\n✅ Reached terminal state — at least one account published." : "\n❌ Reached terminal state — every account failed.");
      process.exit(anyPublished ? 0 : 1);
    }

    await new Promise((r) => setTimeout(r, 3_000));
  }

  console.error("\n⏱️ Timed out after 60s waiting for a terminal state — check your Outstand dashboard.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
