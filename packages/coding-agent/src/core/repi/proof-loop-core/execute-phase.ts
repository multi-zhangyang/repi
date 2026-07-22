/** Map operator/reverse commands to proof-loop phases. */
import type { ProofLoopPhase } from "../proof-loop-runtime.ts";

export function proofLoopPhaseForCommand(command: string): ProofLoopPhase | undefined {
	if (/^re[-_]verifier\b/i.test(command)) return "verifier";
	if (/^re[-_]compiler\b/i.test(command)) return "compiler";
	if (/^re[-_]replayer\b/i.test(command)) return "replayer";
	if (/^re[-_]autofix\b/i.test(command)) return "autofix";
	if (/^re[-_]graph\b/i.test(command)) return "attack-graph";
	if (/^re[-_]runtime[-_]adapter\b/i.test(command)) return "runtime-adapter";
	if (/^re[-_]knowledge(?:[-_]graph)?\b/i.test(command)) return "knowledge";
	if (/^re[-_]complete\b/i.test(command)) return "completion";
	if (/^re[-_]context\s+resume\b/i.test(command)) return "compact-resume";
	if (/^re[-_](?:delegate|swarm|supervisor)\b/i.test(command)) return "operator-feedback";
	return undefined;
}
