/** Mobile runtime format. */
/** Mobile runtime anchors/summary/format with reverse proof fields. */

import { reverseProofGateLines } from "../reverse-capture.ts";
import type { MobileRuntimeArtifact } from "./types.ts";

export function formatMobileRuntime(mobile: MobileRuntimeArtifact, path?: string): string {
	return [
		"mobile_runtime:",
		path ? `mobile_runtime_artifact: ${path}` : undefined,
		`timestamp: ${mobile.timestamp}`,
		`mode: ${mobile.mode}`,
		`mission_id: ${mobile.missionId ?? "none"}`,
		`route: ${mobile.route ?? "none"}`,
		`target: ${mobile.target ?? "<missing>"}`,
		`package_name: ${mobile.packageName ?? "<missing>"}`,
		`timeout_ms: ${mobile.timeoutMs}`,
		"device_matrix:",
		...(mobile.deviceMatrix.length ? mobile.deviceMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"apk_inventory:",
		...(mobile.apkInventory.length ? mobile.apkInventory.map((item: any) => `- ${item}`) : ["- none"]),
		"process_map:",
		...(mobile.processMap.length ? mobile.processMap.map((item: any) => `- ${item}`) : ["- none"]),
		"hook_plan:",
		...(mobile.hookPlan.length ? mobile.hookPlan.map((item: any) => `- ${item}`) : ["- none"]),
		"frida_hooks:",
		...(mobile.fridaHooks.length ? mobile.fridaHooks.map((item: any) => `- ${item}`) : ["- none"]),
		"native_trace:",
		...(mobile.nativeTrace.length ? mobile.nativeTrace.map((item: any) => `- ${item}`) : ["- none"]),
		"anti_debug_checks:",
		...(mobile.antiDebugChecks.length ? mobile.antiDebugChecks.map((item: any) => `- ${item}`) : ["- none"]),
		"executions:",
		...(mobile.executions.length
			? mobile.executions.map(
					(item: any) =>
						`- ${item.label} [${item.status}] exit=${item.exit ?? "n/a"} stdout_sha256=${item.stdoutHash ?? "n/a"} stderr_sha256=${item.stderrHash ?? "n/a"}`,
				)
			: ["- planned mobile runtime capture; run re_mobile_runtime run <apk-or-package> [packageName] [timeout-ms]"]),
		"runtime_anchors:",
		...(mobile.runtimeAnchors.length ? mobile.runtimeAnchors.map((item: any) => `- ${item}`) : ["- none"]),
		"replay_commands:",
		...(mobile.replayCommands.length ? mobile.replayCommands.map((item: any) => `- ${item}`) : ["- none"]),
		"capture_script:",
		"```bash",
		mobile.captureScript,
		"```",
		"mobile_next_actions:",
		...(mobile.nextActions.length ? mobile.nextActions.map((item: any) => `- ${item}`) : ["- re_verifier matrix"]),
		...reverseProofGateLines(),
		"technique_hints: re_techniques show mobile-apk-triage-frida-bridge | mobile-ssl-pinning-bypass | mobile-root-bypass",
		`next_mobile_command: ${mobile.mode === "run" ? "re_verifier matrix" : `re_mobile_runtime run ${mobile.target ?? mobile.packageName ?? "<apk-or-package>"}`}`,
		"source_artifacts:",
		...(mobile.sourceArtifacts.length ? mobile.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
