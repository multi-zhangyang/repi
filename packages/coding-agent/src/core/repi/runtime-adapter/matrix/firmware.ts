/**
 * Runtime adapter execution matrix.
 */
import type { RuntimeAdapterExecutionSpec } from "../types.ts";
import { RUNTIME_ADAPTER_FIRMWARE_SPECS_EXTRA } from "./firmware-extra.ts";
/** Runtime adapter matrix: firmware. */
export const RUNTIME_ADAPTER_FIRMWARE_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "binwalk-firmware-extract-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "firmware-iot",
		tool: "binwalk",
		fallbackTool: "file",
		runnerKind: "shell-command",
		commandTemplate:
			"adapter-binwalk-firmware-extract-runner: " +
			"printf '[firmware-target] %s\\n' <target>; file <target> 2>/dev/null | sed 's/^/[firmware-file] /'; " +
			"sha256sum <target> 2>/dev/null | awk '{print \"[firmware-sha256] \"$1}'; " +
			"binwalk <target> 2>/dev/null | sed 's/^/[firmware-binwalk] /' | head -200; " +
			'OUT="${REPI_RUNTIME_ADAPTER_WORKDIR:-$HOME/.repi/agent/recon/runtime/adapter-binwalk}"; mkdir -p "$OUT"; ' +
			"binwalk -eM <target> -C \"$OUT\" 2>/dev/null | sed 's/^/[firmware-extract] /' | head -120 || true; " +
			"find \"$OUT\" -maxdepth 4 -type d \\( -iname '*squashfs*' -o -iname 'rootfs' -o -iname '_*.extracted' \\) 2>/dev/null | sed 's/^/[firmware-rootfs-dir] /' | head -40; " +
			"find \"$OUT\" -maxdepth 5 -type f \\( -name 'passwd' -o -name 'shadow' -o -name '*uhttpd*' -o -name '*dropbear*' -o -name '*.conf' \\) 2>/dev/null | sed 's/^/[firmware-config] /' | head -80 || true; printf '[firmware-env] binwalk=%s file=%s\\n' \"$(command -v binwalk || true)\" \"$(command -v file || true)\"; if [ -f '<target>' ]; then printf '[firmware-proof-capture] domain=firmware extract=1 binwalk=1 image=1\\n'; printf '[firmware-proof-capture] proof.exit=partial_runtime_capture bind_ready=true note=binwalk-host-cap\\n'; else printf '[firmware-proof-capture] domain=firmware extract=0 binwalk=%s image=0\\n' \"$(command -v binwalk >/dev/null 2>&1 && echo 1 || echo 0)\"; printf '[firmware-proof-capture] proof.exit=pending_runtime_capture bind_ready=false note=need-firmware-image-or-rootfs\\n'; fi; printf '[runtime-technique] fw-rootfs-extract | fw-busybox-cred-dump\\n'",
		fallbackCommandTemplate:
			"adapter-binwalk-firmware-extract-runner-fallback: printf '[firmware-target] %s\\n' <target>; file <target> | sed 's/^/[firmware-file] /'; strings -a <target> | grep -Ei 'squashfs|uboot|busybox|passwd|dropbear|httpd|root:|admin' | sed 's/^/[firmware-string] /' | head -220 || true",
		parserRules: [
			{
				id: "parser-firmware-file-hash",
				regex: "(\\[firmware-target\\]|\\[firmware-file\\]|\\[firmware-sha256\\]|\\[firmware-binwalk\\]|DECIMAL|HEXADECIMAL)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "filesystem extraction",
			},
			{
				id: "parser-binwalk-signature",
				regex: "(DECIMAL|HEXADECIMAL|Squashfs|uImage|gzip|LZMA)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "filesystem extraction",
			},
			{
				id: "parser-rootfs-extract",
				regex: "(rootfs|squashfs|_.*\\.extracted|filesystem)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "service map",
			},
			{
				id: "parser-firmware-extract-dir",
				regex: "(\\[firmware-extract\\]|\\[firmware-rootfs-dir\\]|\\[firmware-config\\]|_.*\\.extracted|squashfs-root)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "service map",
			},
			{
				id: "parser-firmware-service-map",
				regex: "(httpd|dropbear|telnet|passwd|shadow|config)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "credential/config proof",
			},
		],
		artifactKinds: ["firmware-signature-map", "rootfs-extraction-manifest", "runtime-adapter-transcript"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_RUNTIME_ADAPTER_WORKDIR", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"filesystem extraction",
			"service map",
			"credential/config proof",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
	...RUNTIME_ADAPTER_FIRMWARE_SPECS_EXTRA,
];
