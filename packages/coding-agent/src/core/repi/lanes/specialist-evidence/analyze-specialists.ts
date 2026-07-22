/** Apply domain specialist evidence analyzers into findings/followups. */

import type { LaneCommandPack } from "../self-heal.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import { analyzeCryptoStegoEvidence, analyzeMalwareEvidence } from "./crypto_malware_analyzers.ts";
import { analyzeAgentSecurityEvidence } from "./dfir/agent-security.ts";
import { analyzeCloudIdentityEvidence } from "./dfir/cloud.ts";
import { analyzeIdentityAdEvidence } from "./dfir/identity-ad.ts";
import { analyzeMemoryForensicsEvidence } from "./dfir/memory.ts";
import { analyzePcapDfirEvidence } from "./dfir/pcap.ts";
import { analyzeFirmwareIotEvidence, analyzeIosEvidence } from "./mobile_firmware_analyzers.ts";
import { analyzeNativeDeepEvidence } from "./native_pwn/deep.ts";
import { analyzeExploitReliabilityEvidence } from "./native_pwn/exploit.ts";
import { analyzeFridaGdbEvidence } from "./native_pwn/frida-gdb.ts";
import { analyzePwnPrimitiveEvidence } from "./native_pwn/pwn.ts";
import { mergeSpecialistEvidenceAnalysis } from "./quality.ts";
import { analyzeToolRepairEvidence } from "./repair_analyzers.ts";
import { analyzeBrowserXhrWsEvidence } from "./web/browser.ts";
import { analyzeJsSigningEvidence } from "./web/js-signing.ts";
import { analyzeWebScannerEvidence } from "./web/scanner.ts";

export function applySpecialistEvidenceAnalyzers(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
	lowerLane: string,
	findings: string[],
	followups: LaneCommand[],
	result: { code: number; stdout: string; stderr: string; killed?: boolean },
): string | undefined {
	const addFinding = (finding: string) => {
		if (!findings.includes(finding)) findings.push(finding);
	};
	const specialistNextHints = [
		mergeSpecialistEvidenceAnalysis(analyzeToolRepairEvidence(pack, combined), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeNativeDeepEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeBrowserXhrWsEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeWebScannerEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeJsSigningEvidence(pack, combined), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeCryptoStegoEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzePwnPrimitiveEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(
			analyzeExploitReliabilityEvidence(pack, combined, targetArg),
			findings,
			followups,
		),
		mergeSpecialistEvidenceAnalysis(analyzePcapDfirEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeMemoryForensicsEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeFirmwareIotEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeIosEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeAgentSecurityEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeMalwareEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeFridaGdbEvidence(pack, combined, targetArg), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeCloudIdentityEvidence(pack, combined), findings, followups),
		mergeSpecialistEvidenceAnalysis(analyzeIdentityAdEvidence(pack, combined), findings, followups),
	].filter((hint): hint is string => Boolean(hint));
	if (specialistNextHints.length > 0) {
		addFinding(`specialist runtime follow-up hints: ${specialistNextHints.join(", ")}`);
	}

	let nextLane: string | undefined;
	if (specialistNextHints.length > 0) nextLane = specialistNextHints[0];
	if (!nextLane && /triage|map|surface|observe|mitigation/.test(lowerLane) && findings.length > 0)
		nextLane = "control-flow/state/prove";
	if (
		!nextLane &&
		/control|flow|state|prove|primitive/.test(lowerLane) &&
		/comparison|route\/auth|JS runtime|address anchors/.test(findings.join("\n"))
	) {
		nextLane = "runtime-proof/poc";
	}
	if (!nextLane && /runtime|proof|poc|verify|exploit/.test(lowerLane) && result.code === 0) nextLane = "report";
	if (followups.length > 0)
		addFinding(`next command pack candidates: ${followups.map((command: any) => command.label).join(", ")}`);
	if (findings.length === 0) addFinding("no high-signal anchors parsed; switch evidence surface or widen passive map");
	return nextLane;
}
