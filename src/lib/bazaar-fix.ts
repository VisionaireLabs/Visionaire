/**
 * Bazaar discovery extension wrapper that injects `input.method`.
 *
 * Why this exists:
 *   @x402/extensions/bazaar v2 has a producer/validator mismatch. The
 *   schema declares `bazaar.info.input.method` as REQUIRED (enum:
 *   POST | PUT | PATCH), but `declareDiscoveryExtension()` uses
 *   `DistributiveOmit<..., "method">` and strips the field from the
 *   emitted info block.
 *
 *   Result: every endpoint that ships the bazaar extension fails the
 *   agentic.market validator with:
 *     "(root).input.method: input.method must be one of the following:
 *      POST, PUT, PATCH"
 *
 *   This wrapper calls the SDK helper, then injects `method: "POST"` into
 *   the emitted `bazaar.info.input` object. Single point of repair.
 *
 *   When @x402/extensions ships a fix that lets `method` pass through, this
 *   wrapper can become a passthrough. Until then, USE IT EVERYWHERE that
 *   would otherwise call declareDiscoveryExtension directly.
 *
 *   Reported externally? Not yet (2026-05-24). Worth filing an issue at
 *   github.com/coinbase/x402 once we've confirmed it's not user error on
 *   our side via the Bazaar discord. For now, ship the workaround so
 *   listing isn't blocked.
 */

import {
  declareDiscoveryExtension,
  type DeclareDiscoveryExtensionInput,
} from "@x402/extensions/bazaar";

type Method = "POST" | "PUT" | "PATCH";

export function declareDiscoveryExtensionWithMethod(
  config: DeclareDiscoveryExtensionInput,
  method: Method = "POST"
): Record<string, unknown> {
  const ext = declareDiscoveryExtension(config) as Record<string, any>;
  // Defensive: only inject when bazaar.info.input exists and is an HTTP shape
  // (MCP variants don't have input.method).
  if (
    ext?.bazaar?.info?.input &&
    typeof ext.bazaar.info.input === "object" &&
    ext.bazaar.info.input.type === "http" &&
    !ext.bazaar.info.input.method
  ) {
    ext.bazaar.info.input.method = method;
  }
  return ext;
}
