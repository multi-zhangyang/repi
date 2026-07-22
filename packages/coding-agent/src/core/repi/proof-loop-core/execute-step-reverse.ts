/** Proof-loop reverse-heavy step phases (runtime-adapter / completion). */

import type { ExtensionAPI } from "../../extensions/types.ts";
import { formatCompletionAudit } from "../completion-audit.ts";
import type { OperationExecution } from "../operator-step.ts";
import type { ProofLoopStep } from "../proof-loop-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { runRuntimeAdapterExecution } from "../runtime-adapter-exec.ts";

export async function executeProofLoopReversePhase(
	pi: ExtensionAPI,
	step: ProofLoopStep,
	target: string | undefined,
	helpers: {
		done: (output: string) => OperationExecution;
		blocked: (output: string) => OperationExecution;
	},
): Promise<OperationExecution | undefined> {
	const { done, blocked } = helpers;
	if (step.phase === "runtime-adapter") {
		const match = /^re[-_]runtime[-_]adapter\s+run\s+(\S+)(?:\s+(.+))?$/i.exec(step.command.trim());
		const adapter = match?.[1];
		const adapterTarget = match?.[2]?.trim() || target;
		if (!adapter) return blocked(`runtime adapter step missing adapter id: ${step.command}`);
		return done(await runRuntimeAdapterExecution(pi, { adapter, target: adapterTarget }));
	}
	if (step.phase === "completion") {
		const audit = formatCompletionAudit();
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${step.command} ${target ?? ""} completion`,
			target,
			includeGates: true,
		}).slice(0, 3);
		return done(
			reverseNext.length ? `${audit}\nreverse_next:\n${reverseNext.map((c: any) => `- ${c}`).join("\n")}` : audit,
		);
	}
	return undefined;
}
