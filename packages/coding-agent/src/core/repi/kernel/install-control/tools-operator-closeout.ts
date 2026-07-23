/** Operator reverse-ready closeout: soft-fill report + HARNESS/PROOF skeleton. */

import { writeSoftFillReportScaffold } from "../../completion-audit/soft-fill-report.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";
import { buildCompleteReadySkeleton } from "../install-proof-tools/complete-ready-skeleton.ts";
import { isMissionReverseBound } from "../install-reverse/tools-capture-inflight.ts";

export function checkpointDone(name: string): boolean {
	const mission = readCurrentMission();
	return Boolean(
		mission?.checkpoints?.some((c: { name?: string; status?: string }) => c.name === name && c.status === "done"),
	);
}

export function reverseProofDone(): boolean {
	try {
		return isMissionReverseBound();
	} catch {
		return false;
	}
}

export function shouldStopOperatorThrash(action: string): boolean {
	try {
		if (!reverseProofDone()) return false;
		const reportDone = checkpointDone("report_or_writeup_ready");
		// Reverse bound + report soft-fill/complete closed ⇒ stop all operator thrash.
		if (reportDone) return true;
		const queueDone = checkpointDone("operation_queue_ready") || checkpointDone("operator_queue_ready");
		// After first plan created the queue, only allow one dispatch (to soft-fill report / closeout).
		if (queueDone && action !== "dispatch" && action !== "run") return true;
		// Also stop when completion audit is already ready (even if report note lags).
		const audit = auditCompletion();
		if (Boolean(audit?.ready) && queueDone) return action !== "dispatch" && action !== "run" ? true : reportDone;
		return false;
	} catch {
		return false;
	}
}

export function buildOperatorReadyStopText(): string {
	return [
		"operator_queue:",
		"status: reverse_ready_stop",
		"completion_status: ready",
		"note: reverse_runtime_gate already satisfied; do not plan/dispatch more steps",
		"next: copy HARNESS_BUGS/PROOF skeleton below as final answer (optional re_complete audit)",
		"",
		buildCompleteReadySkeleton({ thrash: true }),
	].join("\n");
}

export function appendOperatorCloseout(params: { text: string; action: string; target?: string }): {
	text: string;
	softReport?: string;
} {
	if (!reverseProofDone()) return { text: params.text };
	if (!(params.action === "plan" || params.action === "dispatch" || params.action === "verify")) {
		return { text: params.text };
	}
	let softReport: string | undefined;
	if ((params.action === "dispatch" || params.action === "plan") && !checkpointDone("report_or_writeup_ready")) {
		try {
			const mission = readCurrentMission();
			softReport = writeSoftFillReportScaffold(String(mission?.route?.domain || params.target || "repi-report"));
		} catch {
			/* optional */
		}
	}
	const nl = "\n";
	const text = [
		params.text,
		"",
		"closeout:",
		"reverse_proof_exit_ready: true",
		softReport ? `soft_fill_report: ${softReport}` : undefined,
		params.action === "dispatch"
			? "next: re_complete audit once (optional if copying skeleton) then HARNESS_BUGS/PROOF only"
			: "next: re_operator dispatch maxSteps=1 then re_complete (or copy skeleton after dispatch)",
		"",
		buildCompleteReadySkeleton({ thrash: true }),
	]
		.filter((line) => line !== undefined)
		.join(nl);
	return { text, softReport };
}
