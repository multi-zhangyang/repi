/** Mobile runtime plan matrices. */
/** Mobile runtime anchors/summary/format with reverse proof fields. */

import { mobileRuntimeShellCommand } from "./mobile-shell.ts";

export function mobileRuntimePlanMatrices(
	target?: string,
	packageName?: string,
	timeoutMs = 15000,
): {
	apkInventory: string[];
	sslPinningPlan: string[];
	rootBypassPlan: string[];
	fridaHooks: string[];
	replayCommands: string[];
	nextActions: string[];
	captureScript: string;
} {
	const captureScript = mobileRuntimeShellCommand(target, packageName, timeoutMs);
	const apkInventory = [
		target
			? `target=${target}: file/bytes/sha256/APK or native library metadata`
			: packageName
				? `target=<dynamic-only>: package=${packageName}; static APK inventory skipped`
				: "target=<missing>: pass APK, package, or native library",
		"static strings for frida/debug/root/xposed/substrate/ptrace/TracerPid/isDebuggerConnected/emulator/Magisk",
		"optional jadx/apktool scaffolds for manifest, smali, JNI and crypto call sites",
	];
	const sslPinningPlan = [
		"locate TrustManager/HostnameVerifier/OkHttp CertificatePinner and network security config markers",
		"runtime hook path: capture TLS compare/pinning decisions without default patching",
		"prefer re_mobile_runtime run with REPI_MOBILE_ATTACH=1 only after package/process map is confirmed",
	];
	const rootBypassPlan = [
		"string/runtime sweep for root/Magisk/xposed/substrate/frida/debugger indicators",
		"record isDebuggerConnected and attach-blocked reasons before any bypass attempt",
		"keep default observability-first; do not force process patch unless operator escalates",
	];
	const fridaHooks = [
		"${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js Java crypto/compare + native compare hooks",
		packageName
			? `REPI_MOBILE_ATTACH=1 re_mobile_runtime run ${target ?? packageName} ${packageName} ${timeoutMs}`
			: "REPI_MOBILE_ATTACH=1 re_mobile_runtime run <apk-or-package> <packageName> <timeout-ms>",
		"native Interceptor.attach strcmp/strncmp/memcmp/strstr via Module.findExportByName",
	];
	const replayCommands = [
		`re_mobile_runtime run ${target ?? packageName ?? "<apk-or-package>"}${packageName ? ` ${packageName}` : ""} ${timeoutMs}`,
		"adb devices -l && frida-ps -Uai",
		"cat ${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js",
		"re_domain_proof_exit show",
	];
	const nextActions = Array.from(
		new Set(
			[
				`re_mobile_runtime run ${target ?? packageName ?? "<apk-or-package>"}${packageName ? ` ${packageName}` : ""} ${timeoutMs}`,
				"re_domain_proof_exit show",
				"re_lane plan runtime-proof <apk-or-package>",
				"re_techniques show mobile-apk-triage-frida-bridge | mobile-ssl-pinning-bypass | mobile-root-bypass",
				"re_verifier matrix",
				"re_compiler draft",
				"re_complete audit",
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 14);
	return {
		apkInventory,
		sslPinningPlan,
		rootBypassPlan,
		fridaHooks,
		replayCommands,
		nextActions,
		captureScript,
	};
}
