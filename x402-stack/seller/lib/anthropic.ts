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
 *
 * Defaults to max_tokens=1024 to fit the short-form endpoints (forest /
 * contemplate). Pass { maxTokens } to override — oracle uses ~2048.
 */
export async function callClaude(
  system: string,
  user: string,
  opts: { maxTokens?: number } = {}
): Promise<{ text: string; ms: number }> {
  const client = getClient();
  const t0 = Date.now();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1024,
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

/**
 * Call Claude Opus 4.7 with a *cached* large prefix and a small dynamic
 * suffix. Used by /api/oracle: the corpus block (~145K tokens, identical
 * across calls) is cached, the user question (small, varies per call)
 * is not. Cache hits drop input cost ~10x.
 *
 * Cache key is implicit: Anthropic hashes the cached block content. As
 * long as we send the same corpus block, cache_control: ephemeral makes
 * subsequent calls within ~5 min cheap.
 */
export async function callClaudeWithCachedPrefix(
  system: string,
  cachedPrefix: string,
  dynamicSuffix: string,
  opts: { maxTokens?: number } = {}
): Promise<{
  text: string;
  ms: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}> {
  const client = getClient();
  const t0 = Date.now();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: cachedPrefix,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: dynamicSuffix,
          },
        ],
      },
    ],
  });

  const ms = Date.now() - t0;

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  // Pull cache stats; SDK types them as optional.
  const u = message.usage as typeof message.usage & {
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };

  return {
    text: block.text,
    ms,
    usage: {
      input_tokens: u.input_tokens,
      output_tokens: u.output_tokens,
      cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    },
  };
}

export { MODEL };
