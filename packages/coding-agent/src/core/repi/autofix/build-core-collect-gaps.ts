/** Autofix collectors: compiler gaps/contradictions. */
import type { AutofixCollectCtx } from "./build-core-collect-types.ts";

export function collectAutofixGapQueues(ctx: AutofixCollectCtx): void {
	const { options, replay, compiler, patchQueue, add } = ctx;
	for (const gap of [...(compiler?.gaps ?? []), ...(compiler?.contradictions ?? [])].slice(0, 12)) {
		add(
			patchQueue,
			"patch",
			gap,
			"compiler gap/contradiction requires a repair scaffold before final claim",
			`re_operator escalate && re_compiler draft${(options.target ?? replay.target) ? ` ${options.target ?? replay.target}` : ""}`,
		);
	}
}
