/** Specialist evidence analyzer: dfir-memory. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";

export function analyzeMemoryForensicsEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/memory forensics/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /memory-forensics|mem-image|mem-vol|mem-credential/i) ||
		/\[mem-(?:image|vol|process|credential|timeline|carve)/i.test(combined);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const imageLines = interestingLines(
		combined,
		/\[mem-image\]|\[mem-vol-info\]|volatility3=missing|sample_sha256/i,
		18,
	);
	if (imageLines.length > 0)
		findings.push(
			`memory forensics image/profile anchors: ${imageLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const processLines = interestingLines(
		combined,
		/\[mem-process\]|\[mem-vol\].*(pslist|pstree|cmdline|dlllist|handles|netscan|sockstat|netstat)|\[mem-strings\]/i,
		22,
	);
	if (processLines.length > 0)
		findings.push(
			`memory forensics process/network anchors: ${processLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const credentialLines = interestingLines(
		combined,
		/\[mem-credential\]|\[mem-vol-credential\]|hashdump|lsadump|cachedump|Authorization|Cookie|AWS_ACCESS_KEY|BEGIN (?:RSA|OPENSSH)|NTLM/i,
		22,
	);
	if (credentialLines.length > 0)
		findings.push(
			`memory forensics credential/artifact anchors: ${credentialLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const timelineLines = interestingLines(
		combined,
		/\[mem-timeline\]|\[mem-vol-timeline\]|\[mem-carve\]|malfind|filescan|dumpfiles|timeliner/i,
		22,
	);
	if (timelineLines.length > 0)
		findings.push(
			`memory forensics timeline/carve anchors: ${timelineLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	if (imageLines.length || processLines.length || credentialLines.length || timelineLines.length) {
		followups.push({
			label: "memory-info-rerun",
			command: `[ -x /tmp/repi-memory-info.sh ] && /tmp/repi-memory-info.sh ${targetArg} || printf '%s\n' 'rerun memory-forensics-image-info-scaffold'`,
			evidence: "refresh memory image info/profile/banners before plugin selection",
		});
		followups.push({
			label: "memory-process-network-rerun",
			command: `[ -x /tmp/repi-memory-process.sh ] && /tmp/repi-memory-process.sh ${targetArg} || printf '%s\n' 'rerun memory process/network scaffold'`,
			evidence: "rerun process tree, command line, DLL/handle and network plugin bundle",
		});
		followups.push({
			label: "memory-credential-artifact-rerun",
			command: `[ -x /tmp/repi-memory-creds.sh ] && /tmp/repi-memory-creds.sh ${targetArg} || printf '%s\n' 'rerun credential/artifact hunt scaffold'`,
			evidence: "rerun credential/token/registry/browser/LSASS artifact hunt",
		});
		followups.push({
			label: "memory-timeline-carve-rerun",
			command: `[ -x /tmp/repi-memory-timeline.sh ] && /tmp/repi-memory-timeline.sh ${targetArg} || printf '%s\n' 'rerun memory timeline/carving scaffold'`,
			evidence: "rerun timeliner/malfind/filescan/dumpfiles and carved artifact review",
		});
	}

	// reverse runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[dfir-memory-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: `dfir-memory-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `dfir-memory-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			{
				label: `dfir-memory-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
		);
	}
	return {
		findings,
		followups,
		nextLane:
			timelineLines.length > 0
				? "report"
				: credentialLines.length > 0
					? "timeline-carve"
					: processLines.length > 0
						? "credential-artifacts"
						: imageLines.length > 0
							? "process-network"
							: undefined,
	};
}
