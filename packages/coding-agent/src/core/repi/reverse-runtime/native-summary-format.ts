/** Native runtime format with reverse domain next. */
import { reverseDomainCaptureNextCommands, reverseProofGateLines } from "../reverse-capture.ts";
import type { NativeRuntimeArtifact } from "./types.ts";

function captureScriptPreview(script: string | undefined, maxLines = 24, maxChars = 1800): string {
	const raw = String(script ?? "").trim();
	if (!raw) return "# <empty capture script>";
	const lines = raw.split("\n");
	const head = lines.slice(0, maxLines).join("\n");
	const clipped = head.length > maxChars ? `${head.slice(0, maxChars)}\n# ...truncated...` : head;
	if (lines.length <= maxLines && raw.length <= maxChars) return clipped;
	return `${clipped}\n# ... capture_script truncated lines=${lines.length} chars=${raw.length} (full script on artifact disk only)`;
}

export function formatNativeRuntime(native: NativeRuntimeArtifact, path?: string): string {
	const scriptChars = String(native.captureScript ?? "").length;
	const anchors = (native.runtimeAnchors ?? []).slice(0, 80);
	return [
		"native_runtime:",
		path ? `native_runtime_artifact: ${path}` : undefined,
		`timestamp: ${native.timestamp}`,
		`mode: ${native.mode}`,
		`mission_id: ${native.missionId ?? "none"}`,
		`route: ${native.route ?? "none"}`,
		`target: ${native.target ?? "<missing>"}`,
		`timeout_ms: ${native.timeoutMs}`,
		"binary_inventory:",
		...(native.binaryInventory.length ? native.binaryInventory.map((item: any) => `- ${item}`) : ["- none"]),
		"mitigation_matrix:",
		...(native.mitigationMatrix.length ? native.mitigationMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"loader_libc:",
		...(native.loaderLibc.length ? native.loaderLibc.map((item: any) => `- ${item}`) : ["- none"]),
		"symbol_map:",
		...(native.symbolMap.length ? native.symbolMap.map((item: any) => `- ${item}`) : ["- none"]),
		"crash_plan:",
		...(native.crashPlan.length ? native.crashPlan.map((item: any) => `- ${item}`) : ["- none"]),
		"gdb_trace:",
		...(native.gdbTrace.length ? native.gdbTrace.map((item: any) => `- ${item}`) : ["- none"]),
		"breakpoint_plan:",
		...(native.breakpointPlan.length ? native.breakpointPlan.map((item: any) => `- ${item}`) : ["- none"]),
		"exploit_scaffold:",
		...(native.exploitScaffold.length ? native.exploitScaffold.map((item: any) => `- ${item}`) : ["- none"]),
		"executions:",
		...(native.executions.length
			? native.executions.map(
					(item: any) =>
						`- ${item.label} [${item.status}] exit=${item.exit ?? "n/a"} stdout_sha256=${item.stdoutHash ?? "n/a"} stderr_sha256=${item.stderrHash ?? "n/a"}`,
				)
			: ["- planned native runtime capture; run re_native_runtime run <elf-or-so> [timeout-ms]"]),
		"runtime_anchors:",
		...(anchors.length ? anchors.map((item: any) => `- ${item}`) : ["- none"]),
		native.runtimeAnchors.length > anchors.length
			? `- ... ${native.runtimeAnchors.length - anchors.length} more anchors on disk`
			: undefined,
		"replay_commands:",
		...(native.replayCommands.length ? native.replayCommands.map((item: any) => `- ${item}`) : ["- none"]),
		`capture_script_chars: ${scriptChars}`,
		"capture_script_preview:",
		"```bash",
		captureScriptPreview(native.captureScript),
		"```",
		"native_next_actions:",
		...(native.nextActions.length ? native.nextActions.map((item: any) => `- ${item}`) : ["- re_verifier matrix"]),
		...reverseProofGateLines(),
		"technique_hints: re_techniques show rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch",
		`next_native_command: ${native.mode === "run" ? "re_verifier matrix" : `re_native_runtime run ${native.target ?? "<elf-or-so>"}`}`,
		"reverse_proof_gate:",
		`- require_proof_exit_before_claim: watch`,
		`- domain_proof_exit_command: re_domain_proof_exit show`,
		"source_artifacts:",
		...(native.sourceArtifacts.length ? native.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
		"reverse_domain_next:",
		...(() => {
			// Avoid JSON.stringify of multi-10k capture scripts on every format call.
			const proofish = [...(native.runtimeAnchors ?? []), ...(native.structuredSummary ?? [])].join("\n");
			if (/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(proofish)) return [] as string[];
			return reverseDomainCaptureNextCommands({
				routeOrBlob: `native_runtime ${(native as any).target ?? ""} ${(native as any).route ?? ""}`,
				target: (native as any).target,
				includeGates: true,
			})
				.slice(0, 2)
				.map((cmd: any) => `- next: ${cmd}`);
		})(),
	]
		.filter(Boolean)
		.join("\n");
}
