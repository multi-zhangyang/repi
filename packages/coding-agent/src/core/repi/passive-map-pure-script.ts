/** Passive map shell script + signal extractors. */
import { shellQuote } from "./target.ts";
import { interestingLines, truncateMiddle } from "./text.ts";

export type PassiveMapExecResult = {
	code: number;
	stdout: string;
	stderr: string;
	killed?: boolean;
};

export function passiveMapScript(target?: string, depth?: number): string {
	const maxDepth = Math.min(Math.max(Math.floor(depth ?? 4), 1), 8);
	const targetArg = shellQuote(target?.trim() || ".");
	return [
		"set +e",
		`TARGET=${targetArg}`,
		'case "$TARGET" in http://*|https://*) ROOT=""; MAP_MODE=http ;; *) if [ -d "$TARGET" ]; then ROOT="$TARGET"; elif [ -f "$TARGET" ]; then ROOT="$(dirname "$TARGET")"; else ROOT="."; fi; MAP_MODE=fs ;; esac',
		'echo "## context"',
		"pwd",
		'printf "target=%s\\n" "$TARGET"',
		'printf "root=%s\\n" "${ROOT:-<none>}"',
		'printf "map_mode=%s\\n" "${MAP_MODE:-fs}"',
		'printf "date_utc=%s\\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"',
		'if [ "$MAP_MODE" = "fs" ]; then git rev-parse --show-toplevel 2>/dev/null || true; fi',
		'echo "## target-stat"',
		'if [ "$MAP_MODE" = "fs" ]; then if [ -e "$TARGET" ]; then ls -la "$TARGET"; file "$TARGET" 2>/dev/null || true; if [ -f "$TARGET" ]; then sha256sum "$TARGET" 2>/dev/null || true; command -v checksec >/dev/null 2>&1 && checksec --file="$TARGET" 2>/dev/null | sed "s/^/[checksec] /" || true; command -v readelf >/dev/null 2>&1 && readelf -h "$TARGET" 2>/dev/null | sed "s/^/[elf-header] /" | head -40 || true; command -v strings >/dev/null 2>&1 && strings -n 6 "$TARGET" 2>/dev/null | grep -Eai "password|license|token|flag|secret|strcmp|memcmp|admin|debug|key" | head -80 | sed "s/^/[strings] /" || true; fi; else echo "target_missing=$TARGET"; fi; else printf "http_target=%s\\n" "$TARGET"; fi',
		'if [ "$MAP_MODE" = "fs" ] && [ -n "$ROOT" ]; then',
		'echo "## file-inventory"',
		`find "$ROOT" -maxdepth ${maxDepth} -type f \\( -path '*/.git/*' -o -path '*/node_modules/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.repi/*' \\) -prune -o -type f -print 2>/dev/null | sort | head -300`,
		'echo "## manifests-configs"',
		`find "$ROOT" -maxdepth ${maxDepth} -type f \\( -name 'package.json' -o -name 'pyproject.toml' -o -name 'requirements*.txt' -o -name 'go.mod' -o -name 'Cargo.toml' -o -name 'pom.xml' -o -name 'build.gradle*' -o -name 'Dockerfile*' -o -name 'docker-compose*.yml' -o -name '.env*' -o -name 'AndroidManifest.xml' -o -name 'Info.plist' -o -name 'openapi*.json' -o -name 'swagger*.json' -o -name '*.pcap' -o -name '*.pcapng' -o -name '*.elf' -o -name 'vuln' -o -name 'crackme*' \\) -print 2>/dev/null | sort | head -200`,
		'echo "## route-auth-search"',
		'if command -v rg >/dev/null 2>&1; then rg -n --glob "!node_modules" --glob "!dist" --glob "!build" "route|router|app\\.|fastify|express|auth|session|jwt|csrf|graphql|websocket|worker|queue|license|serial|flag|verify|sign|crypto|token|secret|admin|debug" "$ROOT" 2>/dev/null | head -240; else grep -RInE "route|router|auth|session|jwt|graphql|websocket|license|serial|flag|verify|sign|token|secret|admin|debug" "$ROOT" 2>/dev/null | head -160; fi',
		'echo "## binary-candidates"',
		`find "$ROOT" -maxdepth ${maxDepth} -type f -exec sh -c 'file "$1" | grep -E "ELF|PE32|Mach-O|Zip archive|Android package|Dalvik|WebAssembly" || true' _ {} \\; 2>/dev/null | head -120`,
		'echo "## pcap-candidates"',
		`find "$ROOT" -maxdepth ${maxDepth} -type f \\( -name '*.pcap' -o -name '*.pcapng' -o -name '*.cap' \\) -print 2>/dev/null | head -40`,
		"fi",
		'case "$TARGET" in http://*|https://*) echo "## http-baseline"; curl -k -sS -D - -o /dev/null --max-time 12 -A "Mozilla/5.0 REPI-passive-map" "$TARGET" 2>&1 | sed -n "1,80p"; curl -k -sS -I --max-time 10 "$TARGET" 2>&1 | sed "s/^/[http-head] /" | sed -n "1,20p"; curl -k -sS --max-time 10 -A "Mozilla/5.0 REPI-passive-map" "$TARGET/robots.txt" 2>&1 | sed "s/^/[robots] /" | head -40;; esac',
	].join("\n");
}

export function passiveMapSignals(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const httpMode = /map_mode=http/i.test(text) || /http_target=https?:\/\//i.test(text);
	const lines = [
		...interestingLines(text, /\bELF\b|\bPE32\b|\bMach-O\b|Android package|WebAssembly|Dalvik/i, 12).map(
			(line) => `binary:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /\[checksec\]|RELRO|NX|PIE|Canary|Full RELRO|No canary/i, 12).map(
			(line) => `mitigation:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /\[strings\]|password|license|token|flag|secret|strcmp|memcmp/i, 12).map(
			(line) => `string:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /route|router|app\.|fastify|express|graphql|websocket|worker|queue/i, 12).map(
			(line) => `route:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /auth|session|jwt|csrf|oauth|token|secret|admin|debug/i, 12).map(
			(line) => `auth-state:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /license|serial|flag|verify|sign|crypto|encrypt|decrypt/i, 12).map(
			(line) => `logic:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(text, /\.pcap|\.pcapng|capinfos|tshark/i, 8).map(
			(line) => `pcap:${truncateMiddle(line, 220)}`,
		),
		...interestingLines(
			text,
			/HTTP\/|server:|location:|set-cookie:|\[robots\]|\[http-api-candidate\]|\[http-body-head\]/i,
			16,
		).map((line) => `http:${truncateMiddle(line, 220)}`),
	];
	if (httpMode) {
		// Drop local-repo path noise; HTTP maps should not claim CWD binaries as target inventory.
		return lines
			.filter((line) => !/^binary:/.test(line) || /ELF|PE32|Mach-O|WebAssembly|Android package|Dalvik/i.test(line))
			.filter((line) => !/^\w+:\.\/packages\//.test(line) && !/^\w+:\.\/repi-profile\//.test(line))
			.slice(0, 48);
	}
	return lines.slice(0, 48);
}
