const _proofLoopWorkerForText = (..._args: any[]) => "worker";

import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
/** Finalize proof-loop gap items: dedupe + reverse runtime capture gap. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function finalizeProofLoopGapItems(
	items: Array<Omit<ProofLoopGapItem, "worker">>,
	_target?: string,
): ProofLoopGapItem[] {
	const deduped = new Map<string, Omit<ProofLoopGapItem, "worker">>();
	for (const item of items) {
		const key = `${item.source}:${item.text}`;
		if (!deduped.has(key)) deduped.set(key, item);
	}
	const reverseBlob = [...deduped.values()].map((item: any) => `${item.source} ${item.text}`).join("\n");
	if (
		/native|pwn|malware|firmware|reverse|binary|technique|mitre|cwe|exploit/i.test(reverseBlob) &&
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(reverseBlob)
	) {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: reverseBlob,
			target: "proof_loop",
		}).slice(0, 4);
		deduped.set("reverse_runtime_capture", {
			source: "reverse_runtime_capture" as any,
			text: [
				"pending_runtime_capture bind_ready=false require proof.exit=partial_runtime_capture|runtime_capture_strong",
				...reverseNext.map((command: any) => `next=${command}`),
			].join(" | "),
			sourceArtifacts: [],
		} as any);
	}
	return [...deduped.values()].slice(0, 32).map((item: any, index: any) => ({
		...item,
		text: item.text || `gap ${index + 1}`,
		worker: "worker" as any /*proofLoopWorkerForText(item.text, (undefined as any))*/,
	}));
}
