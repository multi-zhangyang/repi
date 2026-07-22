/** Completion audit formatting and report scaffolds. */
import { join } from "node:path";
import { strictClaimCheckSnapshot } from "../claim-release/strict.ts";
import { type DomainProofExitClosureV1, formatDomainProofExitClosure } from "../domain-proof-exit.ts";
import { appendEvolution, appendJournal } from "../journal-append.ts";
import { appendCompletionMemoryEvent } from "../memory-events-append.ts";
import { appendEvidence } from "../reflection/types-config.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceToolchainDir, reportDir, writePrivateTextFile } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { auditCompletion } from "./audit.ts";
import type { CompletionAudit } from "./audit-claims.ts";
import { buildEvidenceDigest, formatMission, readCurrentMission, updateMissionCheckpoint } from "./deps.ts";

export function formatCompletionAuditFromAudit(audit: CompletionAudit): string {
	return [
		audit.ready ? "completion_status: ready" : "completion_status: blocked",
		audit.mission ? formatMission(audit.mission) : "mission: none",
		audit.domainProofExitClosure
			? formatDomainProofExitClosure(audit.domainProofExitClosure)
			: "domain_proof_exit_closure:\nDomainProofExitClosureV1: false\nstatus: missing",
		"blockers:",
		...(audit.blockers.length ? audit.blockers.map((item: any) => `- ${item}`) : ["- none"]),
		"warnings:",
		...(audit.warnings.length ? audit.warnings.map((item: any) => `- ${item}`) : ["- none"]),
		"required_output:",
		"- Outcome / Key Evidence / Verification / Next Step",
		"- evidence block with paths, offsets, hashes, commands, requests, hook points, or state transitions",
		"- reproducible commands or explicit reason why no new command applies",
	].join("\n");
}

export function formatCompletionAudit(): string {
	return formatCompletionAuditFromAudit(auditCompletion());
}

export function writeReportScaffold(title?: string): string {
	ensureReconStorage();
	const mission = readCurrentMission();
	const audit = auditCompletion();
	const date = new Date().toISOString().replace(/[:.]/g, "-");
	const safeTitle = (title ?? mission?.route.domain ?? "repi-report").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 80);
	const path = join(reportDir(), `${date}-${safeTitle}.md`);
	const body = [
		"# REPI Report Scaffold",
		"",
		"## Outcome",
		"",
		"## Key Evidence",
		"",
		truncateMiddle(buildEvidenceDigest(), 6000),
		"",
		"## Verification",
		"",
		"## Next Step",
		"",
		"## Mission",
		"",
		mission ? formatMission(mission) : "no mission",
		"",
		"## Completion Audit",
		"",
		formatCompletionAuditFromAudit(audit),
		"",
	].join("\n");
	// Atomic temp+rename (0o600): read back via readText by maintainPlaybooks;
	// a torn writeFileSync would mis-rank/archive with no error. #43/#103.
	writePrivateTextFile(path, body);
	appendCompletionMemoryEvent(audit, path);
	const strictClaim = strictClaimCheckSnapshot();
	updateMissionCheckpoint(
		"report_or_writeup_ready",
		strictClaim.status === "pass" ? "done" : "blocked",
		`${path} strict_claim_check=${strictClaim.status}`,
	);
	return path;
}

export function writeDomainProofExitClosureArtifact(report: DomainProofExitClosureV1): string {
	ensureReconStorage();
	const path = join(
		evidenceToolchainDir(),
		`${report.generatedAt.replace(/[:.]/g, "-")}-${report.domainId ?? "unmapped"}-domain-proof-exit-closure.md`,
	);
	writePrivateTextFile(
		path,
		`${formatDomainProofExitClosure(report)}\n\n## JSON\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`,
	);
	appendEvidence({
		kind: "artifact",
		title: "domain-proof-exit-closure",
		fact: `DomainProofExitClosureV1 domain=${report.domainId ?? "unmapped"} status=${report.status} missing=${report.missingProofExits.length}`,
		command: "re_domain_proof_exit show",
		path,
		hash: report.artifactCorpusHash,
		verify: `cat ${path}`,
		confidence: "domain proof-exit closure bound to ToolchainDomainCapabilityV1 and runtime artifacts",
	});
	updateMissionCheckpoint(
		"minimal_path_proven",
		report.status === "passed" ? "done" : report.matchedProofExits.length ? "pending" : "blocked",
		`DomainProofExitClosureV1 ${report.status}`,
	);
	const reverseStatus = report.status === "passed" ? "done" : report.matchedProofExits.length ? "pending" : "blocked";
	updateMissionCheckpoint("reverse_proof_exit_ready", reverseStatus, `DomainProofExitClosureV1 ${report.status}`);
	try {
		appendJournal(
			"domain-proof-exit",
			`DomainProofExitClosureV1 ${report.status}`,
			[
				`domain=${report.domainId ?? "unmapped"}`,
				`status=${report.status}`,
				`matched=${(report.matchedProofExits ?? []).join(",") || "none"}`,
				`missing=${(report.missingProofExits ?? []).join(",") || "none"}`,
				`artifact=${path}`,
			].join("\n"),
		);
		appendEvolution(
			`domain-proof-exit ${report.status}`,
			`Domain proof-exit closure ${report.status} for ${report.domainId ?? "unmapped"} @ ${path}`,
		);
	} catch {
		/* journal optional */
	}
	return path;
}
