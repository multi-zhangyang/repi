/** iOS/mobile specialist evidence analyzer. */

/**
 * Specialist evidence analyzers: mobile-firmware.
 */
import type { LaneCommand, LaneCommandPack } from "../../lane-commands/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { interestingLines, truncateMiddle } from "../../text.ts";
import { packHasSpecialistSignal } from "../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "./types.ts";

export function analyzeIosEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/mobile \/ ios/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /ios-|iOS IPA|ios-frida|ios-macho/i) ||
		/\[ios-(?:ipa|plist|binary|macho|otool|symbol|class|string|frida|hook|network)/i.test(combined);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const inventoryLines = interestingLines(
		combined,
		/\[ios-ipa\]|\[ios-plist\]|\[ios-binary\]|CFBundleIdentifier|Entitlements/i,
		20,
	);
	if (inventoryLines.length > 0)
		findings.push(
			`iOS IPA inventory anchors: ${inventoryLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const machoLines = interestingLines(
		combined,
		/\[ios-macho\]|\[ios-otool\]|\[ios-symbol\]|\[ios-class\]|\[ios-string\]|SecItem|NSURLSession|CCCrypt|CryptoKit|SecTrust/i,
		24,
	);
	if (machoLines.length > 0)
		findings.push(
			`iOS Mach-O/class/selector anchors: ${machoLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const hookLines = interestingLines(
		combined,
		/\[ios-frida\]|\[ios-hook\]|\[ios-native-hook\]|\[ios-frida-hook-template\]|\[ios-frida-process\]|\[ios-objection\]/i,
		22,
	);
	if (hookLines.length > 0)
		findings.push(
			`iOS Frida/objection hook anchors: ${hookLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	const replayLines = interestingLines(
		combined,
		/\[ios-network-replay\]|\[ios-network-anchor\]|signature|nonce|pinning|Authorization|body_sha256/i,
		18,
	);
	if (replayLines.length > 0)
		findings.push(
			`iOS network/keychain replay anchors: ${replayLines.map((line: any) => truncateMiddle(line, 190)).join(" | ")}`,
		);
	if (inventoryLines.length || machoLines.length || hookLines.length || replayLines.length) {
		followups.push({
			label: "ios-ipa-inventory-rerun",
			command: `[ -x /tmp/repi-ios-inventory.sh ] && /tmp/repi-ios-inventory.sh ${targetArg} || printf '%s\n' 'rerun ios-ipa-inventory-scaffold'`,
			evidence: "refresh IPA/App/Info.plist/binary inventory",
		});
		followups.push({
			label: "ios-macho-class-map-rerun",
			command: `[ -x /tmp/repi-ios-macho.sh ] && /tmp/repi-ios-macho.sh ${targetArg} || printf '%s\n' 'rerun iOS Mach-O/class map scaffold'`,
			evidence: "rerun Objective-C/Swift selector, crypto, keychain and TLS pinning map",
		});
		followups.push({
			label: "ios-frida-hook-rerun",
			command:
				"sed -n '1,260p' /tmp/repi-ios-frida-hooks.js 2>/dev/null; frida-ps -Uai 2>/dev/null | head -120 || true",
			evidence: "review/rerun iOS Frida hook template and device process map",
		});
		followups.push({
			label: "ios-network-replay-rerun",
			command: `python3 - <<'PY'\nprint('[ios-network-replay] rerun ios-network-replay-scaffold or set captured request headers/body from Frida hooks for curl/node verifier')\nPY`,
			evidence: "prepare replay verifier for iOS signed request/TLS-pinning evidence",
		});
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: "ios mobile reverse frida macho",
		includeGates: true,
	}).slice(0, 3);
	return {
		findings,
		followups: Array.from(new Set([...followups, ...reverseNext])).slice(0, 16),
		nextLane:
			replayLines.length > 0
				? "report"
				: hookLines.length > 0
					? "network-replay"
					: machoLines.length > 0
						? "runtime-hooks"
						: inventoryLines.length > 0
							? "static-class-map"
							: undefined,
	} as any;
}
