/** Autofix collectors: blocked replay rows. */

import { shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import type { AutofixCollectCtx } from "./build-core-collect-types.ts";

export function collectAutofixBlockedQueues(ctx: AutofixCollectCtx): void {
	const { options, replay, commandSubstitutions, evidenceRecaptureQueue, nextOperatorQueue, add } = ctx;
	for (const blocked of replay.blocked) {
		const command = /::\s*(.+)$/.exec(blocked)?.[1]?.trim() ?? blocked;
		if (/internal REPI command/i.test(blocked) || /^re[-_]/i.test(command)) {
			const delegatedCommand = command.replace(/^re-/i, "re_");
			const targetRef = options.target ?? replay.target ?? "<target>";
			add(
				commandSubstitutions,
				"command_substitution",
				blocked,
				"internal command captured as shell replay; keep original semantics and delegate outside replay sandbox",
				`re_context pack ${targetRef} && re_complete audit # delegated_internal_original=${delegatedCommand}`,
			);
			nextOperatorQueue.push(delegatedCommand);
			continue;
		}
		if (/target placeholder|unresolved/i.test(blocked)) {
			add(
				evidenceRecaptureQueue,
				"evidence_recapture",
				blocked,
				"replay command still has unresolved target placeholder",
				`re_map ${options.target ?? replay.target ?? "<target>"} 2 && re_context pack ${options.target ?? replay.target ?? "<target>"}`,
			);
			nextOperatorQueue.push(`re_context pack ${options.target ?? replay.target ?? "<target>"}`);
			continue;
		}
		add(
			commandSubstitutions,
			"command_substitution",
			blocked,
			"blocked replay row needs a safer replay wrapper",
			`printf '%s\\n' ${shellQuote(`blocked replay row: ${truncateMiddle(blocked, 160)}`)}; ${command} || true`,
		);
	}
}
