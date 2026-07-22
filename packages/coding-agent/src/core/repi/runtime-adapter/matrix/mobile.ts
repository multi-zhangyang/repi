/**
 * Runtime adapter execution matrix.
 */

import { mobileRuntimeFallbackCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

/** Runtime adapter matrix: mobile. */
export const RUNTIME_ADAPTER_MOBILE_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "frida-mobile-hook-adapter",
		bridgeId: "mobile-frida",
		domainId: "mobile",
		tool: "frida",
		fallbackTool: "bash",
		runnerKind: "frida-hook",
		commandTemplate:
			"adapter-frida-mobile-hook-runner: frida -U -f <target> -l " +
			"$" +
			"{REPI_FRIDA_HOOK:-hooks/repi-mobile.js} --no-pause",
		fallbackCommandTemplate: mobileRuntimeFallbackCommandTemplate(),
		parserRules: [
			{
				id: "parser-frida-hook-output",
				regex: "(frida|hook|Interceptor|Java\\.perform|ObjC|Spawned|Attached|\\[mobile-hook-surface\\]|\\[mobile-package-runtime\\])",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "Java/ObjC/Swift hook",
			},
			{
				id: "parser-mobile-method-anchor",
				regex: "(\\[mobile-manifest\\]|\\[mobile-ios-info\\]|\\[mobile-ios-binary\\]|\\[mobile-archive-entry\\]|\\[mobile-dex-string\\]|\\[mobile-artifact-string\\]|Crypto|Cipher|MessageDigest|NSURLSession|OkHttp|KeyStore|Keychain|classes\\.dex|AndroidManifest\\.xml|Info\\.plist|CFBundleIdentifier)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "runtime attach env checkpoint",
			},
			{
				id: "parser-cert-pinning-anchor",
				regex: "(\\[mobile-cert-pinning\\]|TrustManager|CertificatePinner|SecTrust|pinning|X509)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "hook output artifact contract",
			},
		],
		artifactKinds: ["frida-hook-output-jsonl", "mobile-runtime-attach-manifest", "runtime-adapter-transcript"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_FRIDA_DEVICE", "REPI_FRIDA_HOOK", "REPI_ANDROID_SERIAL", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"Java/ObjC/Swift hook",
			"runtime attach env checkpoint",
			"hook output artifact contract",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
