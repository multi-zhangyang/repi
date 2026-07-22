/** Reverse I/O runtime evidence ledger append. */

import { appendEvidence } from "../reflection/types-config.ts";
import { reverseTechniqueCaptureBind } from "../reverse-capture.ts";
import { reverseEvidenceLedgerPayload } from "../reverse-evidence.ts";

export function appendReverseRuntimeEvidence(
	kind: string,
	target: string | undefined,
	path: string,
	anchors: string[],
	status: string,
): void {
	const structured = (anchors || []).filter(
		(line: any) =>
			typeof line === "string" &&
			(/^(?:query|summary|technique|proof)\./i.test(line) ||
				/^\[runtime-technique\]/i.test(line) ||
				/proof_exit=/i.test(line)),
	);
	const ledger = reverseEvidenceLedgerPayload(structured, anchors);
	const query: Record<string, string> = {
		kind: `reverse_${kind}`,
		status,
		path,
		...ledger.query,
	};
	if (target) query.target = String(target).slice(0, 300);
	for (const line of anchors) {
		if (typeof line !== "string") continue;
		const m = /^(?:query|summary)\.([A-Za-z0-9_.]+)=(.*)$/.exec(line);
		if (m && !(m[1] in query)) query[m[1]] = m[2].slice(0, 300);
		const t = /^\[runtime-technique\]\s*(.+)$/i.exec(line);
		if (t && !query.technique) query.technique = t[1].split("|")[0].trim().slice(0, 200);
		const pe = /^(?:proof\.exit|query\.proof_exit|summary\.runtime_proof_exit)=(.*)$/i.exec(line);
		if (pe) query.proof_exit = pe[1].slice(0, 300);
		const cs = /^(?:query|summary)\.capture_signals=(.*)$/i.exec(line);
		if (cs && !query.capture_signals) query.capture_signals = cs[1].slice(0, 500);
		const bindLine = /^bind_ready=(.*)$/i.exec(line);
		if (bindLine) query.bind_ready = bindLine[1].slice(0, 32);
	}
	if (!query.proof_exit) query.proof_exit = "pending_runtime_capture";
	const metaLines = [
		...ledger.meta,
		...structured.slice(0, 24),
		`reverse_kind=${kind}`,
		`reverse_status=${status}`,
		`reverse_proof_gate=require_proof_exit_before_claim`,
	];
	const techIds = [
		query.technique,
		...anchors
			.filter((line: any) => typeof line === "string" && /\[runtime-technique\]/i.test(line))
			.flatMap((line: any) =>
				line
					.replace(/^\[runtime-technique\]\s*/i, "")
					.split(/[|,]/)
					.map((part: any) => part.replace(/^re_techniques show\s*/i, "").trim())
					.filter(Boolean),
			),
	]
		.filter(Boolean)
		.map((id: any) =>
			String(id)
				.split(/\s+|\|/)[0]
				.trim(),
		)
		.filter(Boolean)
		.slice(0, 6);
	const bind = reverseTechniqueCaptureBind({
		techniqueIds: techIds,
		runtimeProofExit: query.proof_exit,
	});
	for (const line of bind.lines) {
		if (!metaLines.includes(line)) metaLines.push(line);
	}
	query.bind_ready = bind.ready ? "true" : "false";
	if (bind.bound[0]?.catalogProofExit && !query.catalog_proof_exit) {
		query.catalog_proof_exit = bind.bound[0].catalogProofExit.slice(0, 300);
	}
	try {
		appendEvidence({
			type: "reverse_runtime",
			summary: `${kind}:${status}:proof_exit=${query.proof_exit}`,
			target: target || "",
			query,
			meta: {
				kind,
				path,
				status,
				anchors: anchors.slice(0, 40),
				proof_lines: metaLines.slice(0, 40),
				reverse_proof_gate: "require_proof_exit_before_claim",
				capture_signals: query.capture_signals,
				runtime_proof_exit: query.proof_exit,
			},
			source: `re_${kind}`,
		} as any);
	} catch {
		// evidence runtime may be unconfigured in unit tests
	}
}
