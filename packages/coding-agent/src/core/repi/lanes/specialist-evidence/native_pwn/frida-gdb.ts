/** Specialist evidence analyzer: frida-gdb. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";

export function analyzeFridaGdbEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/android|mobile|native|reverse|pwn/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /frida-gdb-trace|Frida\/GDB trace/i);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const traceLines = interestingLines(
		combined,
		/\[repi-frida\]|\[native\]|\[doFinal\]|\[digest\]|Java runtime ready|Interceptor|Module\.findExportByName|Breakpoint|hit breakpoint|info registers|RIP|RSP|GDB/i,
		20,
	);
	if (traceLines.length > 0) {
		findings.push(`Frida/GDB trace anchors: ${traceLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`);
	}
	if (/\[doFinal\.ret\]|\[digest\.ret\]|hexdump|\[native\]/i.test(combined))
		findings.push("runtime hook return/value anchors captured");
	if (traceLines.length > 0) {
		followups.push({
			label: "frida-focused-trace-rerun",
			command: `[ -f /tmp/repi-frida-trace.js ] && sed -n '1,260p' /tmp/repi-frida-trace.js; frida-ps -Uai 2>/dev/null | head -120 || true`,
			evidence: "rerun/review Frida runtime hook with narrowed class/native targets",
		});
		if (pack.target) {
			followups.push({
				label: "gdb-focused-trace-rerun",
				command: `[ -f /tmp/repi-gdb-trace.gdb ] && gdb -q ${targetArg} -x /tmp/repi-gdb-trace.gdb || gdb -q ${targetArg} -ex 'set pagination off' -ex 'break strcmp' -ex 'break memcmp' -ex 'run' -ex 'bt' -ex 'quit'`,
				evidence: "repeat native breakpoint trace around comparison or crypto boundary",
			});
		}
	}

	// reverse runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[frida-gdb-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: `frida-gdb-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `frida-gdb-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			{
				label: `frida-gdb-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
		);
	}
	return { findings, followups, nextLane: traceLines.length > 0 ? "runtime-proof/report" : undefined };
}
