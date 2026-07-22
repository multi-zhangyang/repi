/** Mobile runtime plan matrices / hooks / next actions. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { shellQuote } from "../target.ts";

export function buildMobileRuntimePlanSections(params: {
	target?: string;
	packageName?: string;
	timeoutMs: number;
	dynamicOnly: boolean;
}): {
	deviceMatrix: string[];
	apkInventory: string[];
	processMap: string[];
	hookPlan: string[];
	fridaHooks: string[];
	nativeTrace: string[];
	antiDebugChecks: string[];
	replayCommands: string[];
	nextActions: string[];
} {
	const { target, packageName, timeoutMs, dynamicOnly } = params;
	const deviceMatrix = [
		dynamicOnly
			? "analysis_mode=dynamic-only: packageName supplied without APK; static APK inventory is skipped and ADB/Frida process/hook plan remains active"
			: "analysis_mode=static+dynamic when APK/path is supplied; dynamic-only when only packageName is supplied",
		"adb devices -l baseline and USB/emulator transport state",
		"frida-ps -Uai app/process visibility and package identifier confirmation",
		"pidof/ps for package runtime PID, architecture and user context when device is attached",
	];
	const apkInventory = [
		dynamicOnly
			? `target=<dynamic-only>: package=${packageName}; static APK analysis skipped, use adb/frida package runtime map`
			: target
				? `target=${target}: file/bytes/sha256/APK or native library metadata`
				: "target=<missing>: pass APK, package, or native library",
		"static strings for frida/debug/root/xposed/substrate/ptrace/TracerPid/isDebuggerConnected/emulator/Magisk",
		"optional jadx/apktool command scaffolds for manifest, smali, JNI and crypto call sites",
	];
	const processMap = [
		packageName
			? `package=${packageName}: pidof, ps, frida process map`
			: "package=<missing>: infer package from target or pass packageName",
		"capture package/process/PID before attaching hooks; record attach skipped/blocked reasons",
	];
	const hookPlan = [
		"Java.perform hook: android.os.Debug.isDebuggerConnected, java.lang.String.equals, Cipher.doFinal, MessageDigest.digest, Mac.doFinal",
		"native Interceptor.attach: strcmp, strncmp, memcmp, strstr via Module.findExportByName",
		"attach only when REPI_MOBILE_ATTACH=1 to keep default run observability-first and bounded",
	];
	const fridaHooks = [
		"${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js contains Java crypto/compare and native compare hook template",
		packageName
			? `REPI_MOBILE_ATTACH=1 re_mobile_runtime run ${target ?? packageName} ${packageName} ${timeoutMs}`
			: "REPI_MOBILE_ATTACH=1 re_mobile_runtime run <apk-or-package> <packageName> <timeout-ms>",
	];
	const nativeTrace = [
		"native strcmp/strncmp/memcmp/strstr arguments and return values are logged when Frida attaches",
		"fallback native trace: gdb/lldb breakpoints on compare functions for extracted .so or running process",
	];
	const antiDebugChecks = [
		"string sweep for Frida/root/debug/emulator/xposed/substrate/Magisk/ptrace indicators",
		"runtime hook for Debug.isDebuggerConnected records return value without patching by default",
	];
	const replayCommands = [
		`re_mobile_runtime run ${target ?? packageName ?? "<apk-or-package>"}${packageName ? ` ${packageName}` : ""} ${timeoutMs}`,
		"adb devices -l && frida-ps -Uai",
		"cat ${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js",
		packageName
			? `REPI_MOBILE_ATTACH=1 timeout ${Math.ceil(timeoutMs / 1000)}s frida -U -f ${shellQuote(packageName)} -l \${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js --no-pause`
			: "REPI_MOBILE_ATTACH=1 frida -U -f <packageName> -l ${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/mobile}/frida-hooks.js --no-pause",
	];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `mobile ${target ?? ""} ${packageName ?? ""}`,
		target,
		includeGates: true,
	}).slice(0, 3);
	const nextActions = Array.from(
		new Set([
			...reverseNext,
			`re_mobile_runtime run ${target ?? packageName ?? "<apk-or-package>"}${packageName ? ` ${packageName}` : ""} ${timeoutMs}`,
			"re_domain_proof_exit show",
			"re_lane plan runtime-proof <apk-or-package>",
			"re_techniques show mobile-apk-triage-frida-bridge | mobile-ssl-pinning-bypass | mobile-root-bypass",
			"re_verifier matrix",
			"re_compiler draft",
			"re_knowledge_graph build",
			"re_complete audit",
		]),
	).slice(0, 14);
	return {
		deviceMatrix,
		apkInventory,
		processMap,
		hookPlan,
		fridaHooks,
		nativeTrace,
		antiDebugChecks,
		replayCommands,
		nextActions,
	};
}
