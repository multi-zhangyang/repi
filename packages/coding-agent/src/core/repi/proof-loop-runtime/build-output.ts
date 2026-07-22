import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildProofLoop, latestProofLoopArtifactPath, writeProofLoopArtifact } from "./build-core.ts";
import { formatProofLoop } from "./format.ts";

export function buildProofLoopOutput(
	action: "plan" | "show" | "run" = "plan",
	options: { target?: string; maxSteps?: number; replaySteps?: number } = {},
): string {
	if (action === "show") {
		const path = latestProofLoopArtifactPath();
		if (!path) {
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: "proof_loop missing reverse",
				target: options.target,
			}).slice(0, 3);
			return [
				"proof_loop:",
				"status: missing",
				"next: re_proof_loop plan <target>",
				"reverse_gate: re_domain_proof_exit show; re_complete audit; re_runtime_adapter run",
				"reverse_domain_next:",
				...reverseNext.map((cmd: any) => `- next: ${cmd}`),
			].join("\n");
		}
		return truncateMiddle(readText(path), 20000);
	}
	const proof = buildProofLoop({ ...options, mode: "plan" });
	const path = writeProofLoopArtifact(proof);
	const base = formatProofLoop(proof, path);
	const reverseOpen =
		/pending_runtime_capture|bind_ready\s*=\s*false|proof_exit\s*=\s*pending|reverse_proof_exit/i.test(
			JSON.stringify(proof ?? {}),
		);
	if (!reverseOpen) return base;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${proof.verdict ?? ""} ${(proof as any).gapClassifier?.join?.(" ") ?? ""} reverse`,
		target: options.target ?? proof.target,
	}).slice(0, 4);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}
