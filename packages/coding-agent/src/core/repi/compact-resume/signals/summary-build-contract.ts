/** Compaction resume contract builder. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { truncateMiddle } from "../../text.ts";
import {
	contextPathFromReconCompactionSummary,
	parseReconCompactionDetails,
	reconCompactionNextCommandsFromSummary,
} from "./summary-format.ts";

export function buildReconCompactionResumeContract(params: { compactionEntry: any; fromExtension: boolean }): any {
	const { compactionEntry, fromExtension } = params;
	const details = parseReconCompactionDetails(compactionEntry.details);
	const summary = compactionEntry.summary ?? "";
	const contextPath = details?.contextPath ?? contextPathFromReconCompactionSummary(summary);
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			JSON.stringify({ details, summary }),
		);
	const reverseCaptureCommands = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: JSON.stringify({ details, summary }),
				includeGates: true,
			})
		: [];
	const nextCommands = Array.from(
		new Set([
			...reverseCaptureCommands,
			details?.resumeCommand ?? "re_context resume",
			...(details?.nextCommands ?? []),
			...reconCompactionNextCommandsFromSummary(summary),
		]),
	).slice(0, 24);
	const sourceArtifacts = Array.from(new Set(details?.sourceArtifacts ?? [])).slice(0, 40);
	const hasResume =
		/\bre_context\s+resume\b/i.test(summary) || nextCommands.some((item: any) => /re_context\s+resume/i.test(item));
	const hasOperator =
		/\bre_operator\s+(?:plan|dispatch)\b/i.test(summary) ||
		nextCommands.some((item: any) => /re_operator\s+(?:plan|dispatch)/i.test(item));
	const hasReverseCapture =
		/re_(?:domain_proof_exit|native_runtime|live_browser|js_signing|web_authz_state|mobile_runtime|exploit_lab|runtime_adapter)\b/i.test(
			summary,
		) ||
		nextCommands.some((item: any) =>
			/re_(?:domain_proof_exit|native_runtime|live_browser|js_signing|web_authz_state|mobile_runtime|exploit_lab|runtime_adapter)\b/i.test(
				item,
			),
		);
	const hasProofLoop =
		/\bre_proof_loop\s+run\b/i.test(summary) || nextCommands.some((item: any) => /re_proof_loop\s+run/i.test(item));
	// Reverse-heavy resume is verified by domain capture next; non-reverse still requires operator queue.
	const verified = Boolean(
		fromExtension &&
			details &&
			contextPath &&
			hasResume &&
			hasProofLoop &&
			(reverseHeavy ? hasReverseCapture || hasOperator : hasOperator),
	);
	const resumeContract = [
		`context_path=${contextPath ?? "missing"}`,
		`resume=${details?.resumeCommand ?? "re_context resume"}`,
		reverseHeavy
			? "reverse=domain_proof_exit + re_* run capture before claim"
			: "operator=re_operator plan -> re_operator dispatch 1",
		"proof=re_proof_loop run <target> 4 2 on partial/needs_repair",
		"report=Outcome -> Key Evidence -> Verification -> Next Step",
	];
	const verification = [
		`from_extension=${fromExtension}`,
		`details_kind=${details?.kind ?? "missing"}`,
		`context_path=${contextPath ?? "missing"}`,
		`has_resume=${hasResume}`,
		`has_operator=${hasOperator}`,
		`has_reverse_capture=${hasReverseCapture}`,
		`has_proof_loop=${hasProofLoop}`,
		`next_commands=${nextCommands.length}`,
		`source_artifacts=${sourceArtifacts.length}`,
		`verified=${verified}`,
	];
	return {
		kind: "repi-compaction-resume-contract",
		version: 1,
		timestamp: new Date().toISOString(),
		fromExtension,
		verified,
		compactionEntryId: compactionEntry.id,
		firstKeptEntryId: compactionEntry.firstKeptEntryId,
		tokensBefore: compactionEntry.tokensBefore,
		compactionKind: details?.kind ?? "unknown",
		contextPath,
		resumeCommand: details?.resumeCommand ?? "re_context resume",
		nextCommands,
		sourceArtifacts,
		autonomousBudget: details?.autonomousBudget,
		resumeContract,
		verification,
		summaryHead: truncateMiddle(summary, 2400),
	};
}
