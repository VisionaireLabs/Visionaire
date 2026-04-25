/**
 * Shared Anthropic client.
 * Used by both /api/contemplate and /api/forest.
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-7";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

/**
 * Call Claude Opus 4.7 with a system prompt and user message.
 * Returns the text response and elapsed time in ms.
 */
export async function callClaude(
  system: string,
  user: string
): Promise<{ text: string; ms: number }> {
  const client = getClient();
  const t0 = Date.now();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const ms = Date.now() - t0;

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return { text: block.text, ms };
}

export { MODEL };
