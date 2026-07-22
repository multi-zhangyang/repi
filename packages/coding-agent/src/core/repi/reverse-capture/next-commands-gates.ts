/** Reverse proof gate lines (softband split from next-commands). */
// Landmark: reverseProofGateLines bind_ready proof.exit
import { reverseDomainCaptureNextCommands } from "./next-commands.ts";

export function reverseProofGateLines(techLine?: string): string[] {
	const tech = (techLine || "").replace(/^\[runtime-technique\]\s*/, "");
	const id = tech.split(" | ")[0]?.trim();
	const next = reverseDomainCaptureNextCommands({
		routeOrBlob: tech || id || "",
		includeGates: false,
	});
	return [
		"reverse_proof_gate:",
		`- technique=${id || "unbound"}`,
		"- require_proof_exit_before_claim=true",
		"- prefer_run_over_plan_for_capture=true",
		...next.map((cmd: string) => `- next=${cmd}`),
	];
}
