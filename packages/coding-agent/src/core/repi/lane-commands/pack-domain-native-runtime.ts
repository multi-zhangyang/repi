import { join } from "node:path";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceRunsDir } from "../storage.ts";
import { shellQuote } from "../target.ts";
import type { LaneDomainPackCtx } from "./pack-domain-types.ts";
export function appendLaneDomainNativeRuntime(ctx: LaneDomainPackCtx): void {
	const runtimeMisc = shellQuote(join(evidenceRunsDir(), "misc"));
	const {
		laneName,
		isNativeRoute,
		isAndroidRoute,
		isPwnRoute,
		isWebRoute,
		isJsRoute,
		targetIsDirectory,
		effectiveTarget,
		targetArg,
		urlArg,
		add,
		notes: _notes,
	} = ctx;
	if (/runtime|proof|primitive|state|poc|verify/.test(laneName)) {
		if ((isNativeRoute || isPwnRoute) && !targetIsDirectory) {
			add("ldd-runtime", `ldd ${targetArg} 2>/dev/null || true`, "loader/libc dependencies");
			add(
				"trace-runtime",
				`strace -f -s 256 ${targetArg} 2>&1 | head -240`,
				"runtime syscalls / file / network evidence",
			);
			add(
				"ltrace-comparisons",
				`ltrace -f ${targetArg} 2>&1 | grep -iE 'strcmp|strncmp|memcmp|strstr|open|read|write' | head -120 || true`,
				"library comparison calls",
			);
		}
		if (isAndroidRoute) {
			add(
				"adb-device-state",
				"adb devices; adb shell getprop ro.product.cpu.abi 2>/dev/null || true",
				"device/ABI state",
			);
			add("frida-processes", "frida-ps -Uai 2>/dev/null | head -120 || true", "running/package process map");
			add(
				"frida-hook-scaffold",
				`cat > ${runtimeMisc}/hook.js <<'JS'\nJava.perform(function(){\n  console.log('[repi] Java runtime ready');\n});\nJS\ncat ${runtimeMisc}/hook.js`,
				"minimal Frida hook scaffold",
			);
		}
		if (isWebRoute) {
			add(
				"route-auth-map",
				'rg -n "route|router|app\\.|fastify|express|auth|session|jwt|csrf|graphql|websocket|worker|queue" .',
				"routes/auth/session surface",
			);
			add(
				"state-files",
				"find . -maxdepth 4 -type f \\( -name '*route*' -o -name '*controller*' -o -name '*api*' -o -name '*auth*' -o -name '.env*' -o -name 'docker-compose*.yml' \\) | sort | head -200",
				"state-bearing files",
			);
			add("http-replay-seed", `curl -i -sS ${shellQuote(urlArg)} | sed -n '1,80p'`, "baseline HTTP response");
		}
		if (isJsRoute) {
			add(
				"js-network-surface",
				'rg -n "fetch\\(|XMLHttpRequest|axios|WebSocket|crypto|sign|timestamp|nonce|encrypt|decrypt" .',
				"JS signing/network call sites",
			);
			add(
				"source-map-search",
				"find . -maxdepth 5 -type f \\( -name '*.map' -o -name '*.js' -o -name '*.mjs' \\) | head -200",
				"JS chunks and sourcemaps",
			);
		}
	}

	if (
		/runtime|proof|primitive|state|poc|verify/.test(laneName) &&
		(isNativeRoute || isPwnRoute || isAndroidRoute || isWebRoute || isJsRoute)
	) {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${laneName} ${targetArg ?? ""} lane pack native`,
			target: effectiveTarget,
			includeGates: true,
		}).slice(0, 2);
		for (const command of reverseNext) {
			add("lane-pack-reverse-next", command, "reverse domain capture next");
		}
	}
}
