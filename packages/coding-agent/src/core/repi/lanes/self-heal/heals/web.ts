/** Self-heal domain: web. */
import type { SelfHealCtx } from "./ctx.ts";
import { appendWebCoreHeals } from "./web-core.ts";
import { appendWebReverseHeals } from "./web-reverse.ts";

export function appendWebHeals(ctx: SelfHealCtx): void {
	appendWebCoreHeals(ctx);
	const { route, combined, target, add } = ctx;
	appendWebReverseHeals({ route, combined, target, add });
}
