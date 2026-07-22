/** Mission reverse-ready thrash stop for reverse tools. */
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";

function reverseProofDone(): boolean {
	try {
		const mission = readCurrentMission();
		return Boolean(
			mission?.checkpoints?.some(
				(c: { name?: string; status?: string }) =>
					(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
			),
		);
	} catch {
		return false;
	}
}

export function tryReverseReadyRuntimeAdapterStop(params: {
	action: string;
	adapter?: string;
	target?: string;
}): { content: { type: "text"; text: string }[]; details: Record<string, unknown> } | undefined {
	if (params.action !== "run") return undefined;
	try {
		if (!(reverseProofDone() && auditCompletion()?.ready)) return undefined;
		const nl = String.fromCharCode(10);
		const text = [
			"runtime_adapter:",
			"status: reverse_ready_stop",
			"note: reverse_runtime_gate already satisfied for this mission; do not re-run adapters without a real blocker",
			"next: write HARNESS_BUGS/PROOF only",
		].join(nl);
		return {
			content: [{ type: "text" as const, text }],
			details: {
				action: params.action,
				skipped: true,
				reason: "reverse_ready_stop",
				adapter: params.adapter,
				target: params.target,
			} as Record<string, unknown>,
		};
	} catch {
		return undefined;
	}
}

export function tryReverseReadyDomainProofStop():
	| { content: { type: "text"; text: string }[]; details: Record<string, unknown> }
	| undefined {
	try {
		if (!(reverseProofDone() && auditCompletion()?.ready)) return undefined;
		const nl = String.fromCharCode(10);
		const text = [
			"domain_proof_exit:",
			"status: reverse_ready_stop",
			"note: reverse_runtime_gate already satisfied; do not re-run domain proof or reverse_next thrash",
			"next: write HARNESS_BUGS/PROOF only",
		].join(nl);
		return {
			content: [{ type: "text" as const, text }],
			details: { skipped: true, reason: "reverse_ready_stop" } as Record<string, unknown>,
		};
	} catch {
		return undefined;
	}
}
