/** Autofix collectors: failed replay executions. */
import { shellQuote } from "../target.ts";
import type { AutofixCollectCtx } from "./build-core-collect-types.ts";
import { bootstrapToolFromCommand } from "./helpers.ts";

export function collectAutofixFailedQueues(ctx: AutofixCollectCtx): void {
	const { options, replay, commandSubstitutions, bootstrapQueue, evidenceRecaptureQueue, nextOperatorQueue, add } =
		ctx;
	for (const execution of replay.executions.filter((item: any) => item.status === "failed")) {
		const stderr = `${execution.stderrHead}\n${execution.stdoutHead}`;
		const tool = /command not found|not found|No such file|cannot stat|ModuleNotFoundError|ImportError/i.test(stderr)
			? bootstrapToolFromCommand(execution.command)
			: undefined;
		if (tool) {
			add(
				bootstrapQueue,
				"bootstrap",
				execution.command,
				"replay failed with missing tool/dependency signal",
				`re_bootstrap plan ${tool}`,
			);
			nextOperatorQueue.push(`re_bootstrap plan ${tool}`);
		}
		add(
			commandSubstitutions,
			"command_substitution",
			execution.command,
			`replay failed exit=${execution.exit}`,
			`timeout 60s bash -lc ${shellQuote(execution.command)} || true`,
		);
		add(
			evidenceRecaptureQueue,
			"evidence_recapture",
			execution.command,
			"replay failure requires fresh evidence capture and verifier refresh",
			`re_replayer run ${options.target ?? replay.target ?? "<target>"} 1 && re_verifier matrix`,
		);
	}
}
