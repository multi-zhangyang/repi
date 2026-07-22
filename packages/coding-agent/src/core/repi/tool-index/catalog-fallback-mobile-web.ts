/** Mobile/web/frida missing-tool fallbacks. */
import { pythonString } from "../lane-commands/helpers.ts";
import { replacementIfToolsAvailable, targetArgForPack } from "./catalog-tools.ts";

export function fallbackMobileWebMissingTools(
	command: { label: string; evidence: string; command: string },
	missingTools: string[],
	pack: { target?: string },
	index: Map<string, { present: boolean; path?: string }>,
): { label: string; command: string; evidence: string } | undefined {
	const target = targetArgForPack(pack as never);
	const label = `${command.label}:fallback`;
	const evidence = `${command.evidence}; fallback for missing tools: ${missingTools.join(", ")}`;
	if (missingTools.includes("aapt") && target !== "<TARGET>") {
		return {
			label,
			command: `unzip -l ${target} | head -180; unzip -p ${target} AndroidManifest.xml 2>/dev/null | head -80 || true`,
			evidence,
		};
	}
	if (missingTools.includes("jadx") && target !== "<TARGET>") {
		return {
			label,
			command: `strings -a -n 5 ${target} | grep -iE 'license|serial|key|valid|invalid|check|verify|root|debug|frida|token|secret' | head -220`,
			evidence,
		};
	}
	if (missingTools.includes("curl") && replacementIfToolsAvailable(index, ["python3"])) {
		const urlMatch = /\bcurl\b[\s\S]*?\s((?:https?:\/\/|http:\/\/|https:\/\/)[^\s'"`]+)/.exec(command.command);
		const url = urlMatch?.[1] ?? pack.target;
		if (url) {
			return {
				label,
				command: `python3 - <<'PY'\nfrom urllib.request import Request, urlopen\nurl=${pythonString(url)}\nr=urlopen(Request(url, headers={'User-Agent':'REPI'}), timeout=10)\nprint('status:', r.status)\nprint(r.read(4096).decode('utf-8','replace'))\nPY`,
				evidence,
			};
		}
	}
	if (
		(missingTools.includes("frida") || missingTools.includes("frida-ps")) &&
		target !== "<TARGET>" &&
		replacementIfToolsAvailable(index, ["adb", "strings", "unzip"])
	) {
		return {
			label,
			command: [
				`adb devices -l 2>/dev/null || true`,
				`file ${target} 2>/dev/null || true`,
				`strings -a -n 6 ${target} 2>/dev/null | grep -iE 'frida|gadget|ssl|pinning|root|debug|strcmp|memcmp|Cipher|MessageDigest' | head -120 || true`,
				`echo "[native-frida] host=missing package_probe=strings/adb fallback"`,
			].join("; "),
			evidence: `${evidence}; frida missing → adb/strings host-side reverse probe (no attach)`,
		};
	}
	return undefined;
}
