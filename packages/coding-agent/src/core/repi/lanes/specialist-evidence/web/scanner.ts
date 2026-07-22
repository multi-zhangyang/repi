/** Specialist evidence analyzer: web-scanner. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";

export function analyzeWebScannerEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/web vulnerability|web scan|scanner/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /web-scan-|web vulnerability scanner/i) ||
		/\[web-scan-|\[web-finding-queue\]/i.test(combined);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const scopeLines = interestingLines(combined, /\[web-scan-scope\]|\[web-scan-header\]|\[web-scan-httpx\]/i, 18);
	if (scopeLines.length > 0)
		findings.push(
			`web scanner scope anchors: ${scopeLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	const crawlLines = interestingLines(
		combined,
		/\[web-scan-crawl\]|\[web-scan-corpus\]|\[web-scan-robots\]|\[web-scan-sitemap\]/i,
		20,
	);
	if (crawlLines.length > 0)
		findings.push(
			`web scanner crawl corpus anchors: ${crawlLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	const contentLines = interestingLines(
		combined,
		/\[web-scan-ffuf\]|\[web-scan-ferox\]|\[web-scan-gobuster\]|\[web-scan-content\]/i,
		16,
	);
	if (contentLines.length > 0)
		findings.push(
			`web scanner content discovery anchors: ${contentLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	const templateLines = interestingLines(
		combined,
		/\[web-scan-nuclei\]|\[web-scan-nikto\]|\[web-scan-dalfox\]|\[web-scan-template\]/i,
		18,
	);
	if (templateLines.length > 0)
		findings.push(
			`web scanner template finding anchors: ${templateLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	const verifierLines = interestingLines(
		combined,
		/\[web-scan-verifier\]|body_sha256|status_meta=|\[web-finding-queue\]/i,
		20,
	);
	if (verifierLines.length > 0)
		findings.push(
			`web scanner manual replay anchors: ${verifierLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (scopeLines.length || crawlLines.length || contentLines.length || templateLines.length || verifierLines.length) {
		followups.push({
			label: "web-scan-scope-rerun",
			command: `[ -x /tmp/repi-web-scope.sh ] && /tmp/repi-web-scope.sh ${targetArg} || printf '%s\n' 'rerun web-scan-scope-baseline via re_lane plan/run'`,
			evidence: "refresh web scope baseline before expanding scanner output",
		});
		followups.push({
			label: "web-scan-corpus-rerun",
			command: `[ -x /tmp/repi-web-crawl.sh ] && /tmp/repi-web-crawl.sh ${targetArg} || printf '%s\n' 'rerun web-scan-crawl-corpus-scaffold'`,
			evidence: "refresh crawl/route corpus for content discovery and replay verifier",
		});
		followups.push({
			label: "web-scan-template-rerun",
			command: `[ -x /tmp/repi-web-template-scan.sh ] && /tmp/repi-web-template-scan.sh ${targetArg} || printf '%s\n' 'rerun bounded template scan and keep JSONL artifact'`,
			evidence: "rerun bounded nuclei/nikto/dalfox candidate finding queue",
		});
		followups.push({
			label: "web-scan-manual-replay-rerun",
			command: `[ -x /tmp/repi-web-verify.py ] && python3 /tmp/repi-web-verify.py ${targetArg} || printf '%s\n' 'rerun manual replay verifier after corpus/finding queue exists'`,
			evidence: "replay scanner candidates with status/body hash before claiming vulnerability",
		});
	}

	// reverse/web runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[web-scanner-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: `web-scanner-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `web-scanner-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			{
				label: `web-scanner-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
			{
				label: `web-scanner-live-browser`,
				command: `re_live_browser run ${targetArg}`,
				evidence: "web live proof path",
			} as any,
		);
	}
	return {
		findings,
		followups,
		nextLane:
			verifierLines.length > 0
				? "report"
				: templateLines.length > 0 || contentLines.length > 0
					? "verify"
					: crawlLines.length > 0
						? "template-scan"
						: scopeLines.length > 0
							? "crawl"
							: undefined,
	};
}
