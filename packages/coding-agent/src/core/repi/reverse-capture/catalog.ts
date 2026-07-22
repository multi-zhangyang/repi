/** Catalog technique proof fields and bind_ready scoring. */
import { reverseEvidenceEnrichFromTechniqueId, reverseEvidenceProofLines } from "../reverse-evidence.ts";
import { techniqueById } from "../techniques.ts";

export function reverseStructuredProofFields(techLine?: string): string[] {
	const lines: string[] = [];
	if (!techLine) {
		lines.push("summary.proof_exit=catalog_unbound");
		lines.push("technique.proof_exit=catalog_unbound");
		lines.push("reverse_proof_gate=require_proof_exit_before_claim");
		return lines;
	}
	const cleaned = techLine.replace(/^\[runtime-technique\]\s*/i, "");
	const techId = cleaned.split("|")[0]?.trim();
	if (techId) {
		lines.push(`query.technique=${techId}`);
		lines.push(`summary.technique=${techId}`);
	}
	for (const extra of reverseEvidenceEnrichFromTechniqueId(techLine)) {
		if (!lines.includes(extra)) lines.push(extra);
	}
	// Catalog-bound requirement lines (technique.proof_exit / mitre / cwe). Not capture status.
	const proofLines = reverseEvidenceProofLines(lines);
	for (const p of proofLines) {
		if (!lines.includes(p)) lines.push(p);
	}
	// Keep requirement under technique/summary.proof_exit; capture status is filled by reverseRuntimeCaptureProofFields.
	if (!lines.some((l: any) => /^technique\.proof_exit=/i.test(l) || /^summary\.proof_exit=/i.test(l))) {
		lines.push("summary.proof_exit=catalog_unbound");
	}
	lines.push("reverse_proof_gate=require_proof_exit_before_claim");
	return lines;
}

export function reverseTechniqueCaptureBind(args: {
	techniqueIds?: string[];
	runtimeProofExit?: string;
	lookup?: (id: string) => { id?: string; proofExit?: string; name?: string } | undefined;
}): {
	bound: Array<{ id: string; catalogProofExit?: string; name?: string }>;
	runtimeProofExit: string;
	ready: boolean;
	lines: string[];
} {
	const ids = (args.techniqueIds ?? [])
		.map((id: any) => id.trim())
		.filter(Boolean)
		.slice(0, 8);
	const resolve =
		args.lookup ??
		((id: string) => {
			const entry = techniqueById(id);
			if (!entry) return undefined;
			return { id: entry.id, proofExit: entry.proofExit, name: entry.name };
		});
	const bound = ids.map((id: any) => {
		const entry = resolve(id);
		return { id, catalogProofExit: entry?.proofExit, name: entry?.name };
	});
	const runtime = (args.runtimeProofExit || "pending_runtime_capture").trim();
	const ready = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(runtime);
	const lines: string[] = [];
	for (const row of bound) {
		lines.push(`bind.technique=${row.id}`);
		if (row.name) lines.push(`bind.technique_name=${row.name}`);
		if (row.catalogProofExit) lines.push(`bind.catalog_proof_exit=${row.catalogProofExit}`);
	}
	lines.push(`bind.runtime_proof_exit=${runtime}`);
	lines.push(`bind.ready=${ready ? "true" : "false"}`);
	// Alias forms consumed by completion audit / adapter scoring / claim gates.
	lines.push(`bind_ready=${ready ? "true" : "false"}`);
	lines.push(`query.bind_ready=${ready ? "true" : "false"}`);
	lines.push(`summary.bind_ready=${ready ? "true" : "false"}`);
	if (!ready)
		lines.push("bind.next=re_native_runtime|re_mobile_runtime|re_exploit_lab|re_live_browser|re_web_authz_state");
	return { bound, runtimeProofExit: runtime, ready, lines: Array.from(new Set(lines)).slice(0, 24) };
}
