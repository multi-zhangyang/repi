/** Reverse proof-exit seed for proof-loop quick plan. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { RepiProofLoopGapItem } from "./types.ts";

export function seedProofLoopQuickPlanReversePhase(
	items: RepiProofLoopGapItem[],
	classes: Set<string>,
	addPhase: (phase: string, text: string, sources: string[], commands: string[]) => void,
	target?: string,
): void {
	const reverseGap =
		items.some((item: any) =>
			/proof_exit|pending_runtime_capture|bind_ready|reverse_kind|native-runtime|pwn|malware|firmware|technique|mitre|cwe|reverse_proof|frontend|js|browser|authz|web/i.test(
				`${item.source} ${item.text}`,
			),
		) || classes.has("runtime_adapter_gap");
	if (!reverseGap) return;
	addPhase(
		"reverse_proof_exit",
		"reverse/runtime proof_exit capture and domain proof-exit required before claim",
		["runtime_adapter_gap", "proof_spine_seed"],
		reverseDomainCaptureNextCommands({
			routeOrBlob: items.map((item: any) => `${item.source} ${item.text}`).join("\n"),
			target: target?.trim(),
		}),
	);
}
