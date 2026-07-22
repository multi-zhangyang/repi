/** Specialist evidence analyzer: dfir-pcap. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle, uniqueMatches } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
import { pcapDfirEvidenceFollowups, pcapDfirNextLane, pcapDfirReverseCaptureFollowups } from "./pcap-followups.ts";

export function analyzePcapDfirEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/dfir|pcap|forensic|stego/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /pcap-flow|PCAP\/DFIR/i) ||
		/\.(?:pcap|pcapng|cap)$/i.test(pack.target ?? "");
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const flowLines = interestingLines(
		combined,
		/conversations|endpoints|<->|tcp\.stream|udp|http\.request|dns\.qry|tls\.handshake|authorization|cookie|password|token|flag|export-objects|repi-pcap-objects|foremost/i,
		24,
	);
	if (flowLines.length > 0) {
		findings.push(
			`PCAP/DFIR traffic flow anchors: ${flowLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const streamRankLines = interestingLines(combined, /\[pcap-stream-rank\]/i, 18);
	if (streamRankLines.length > 0) {
		findings.push(
			`PCAP stream ranking anchors: ${streamRankLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const secretTimelineLines = interestingLines(combined, /\[pcap-secret-timeline\]/i, 18);
	if (secretTimelineLines.length > 0) {
		findings.push(
			`PCAP secret timeline anchors: ${secretTimelineLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const extractedFiles = uniqueMatches(combined, /(\/tmp\/repi-(?:pcap-objects|carve)\/[^\s]+)/gi, 12);
	if (extractedFiles.length > 0) findings.push(`PCAP extracted artifact anchors: ${extractedFiles.join(", ")}`);
	const transformLines = interestingLines(combined, /\[pcap-transform-chain\]|base64|gzip|zlib|secret-string/i, 16);
	if (transformLines.length > 0) {
		findings.push(
			`PCAP transform chain anchors: ${transformLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	if (
		pack.target &&
		(flowLines.length > 0 ||
			streamRankLines.length > 0 ||
			secretTimelineLines.length > 0 ||
			extractedFiles.length > 0 ||
			transformLines.length > 0)
	) {
		followups.push(...pcapDfirEvidenceFollowups(targetArg, pack.target));
	}
	// reverse runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[dfir-pcap-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(...pcapDfirReverseCaptureFollowups(targetArg));
	}
	return {
		findings,
		followups,
		nextLane: pcapDfirNextLane({
			secret: secretTimelineLines.length,
			transform: transformLines.length,
			flow: flowLines.length,
			stream: streamRankLines.length,
			extracted: extractedFiles.length,
		}),
	};
}
