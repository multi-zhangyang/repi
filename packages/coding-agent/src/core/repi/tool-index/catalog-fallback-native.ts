/** Native reverse missing-tool fallbacks. */
import { repiIndexedToolPresent } from "../tool-presence.ts";
import { replacementIfToolsAvailable, targetArgForPack } from "./catalog-tools.ts";

export function fallbackNativeMissingTools(
	command: { label: string; evidence: string; command: string },
	missingTools: string[],
	pack: { target?: string },
	index: Map<string, { present: boolean; path?: string }>,
): { label: string; command: string; evidence: string } | undefined {
	const target = targetArgForPack(pack as never);
	const label = `${command.label}:fallback`;
	const evidence = `${command.evidence}; fallback for missing tools: ${missingTools.join(", ")}`;
	if (
		missingTools.includes("checksec") &&
		target !== "<TARGET>" &&
		replacementIfToolsAvailable(index, ["rabin2", "readelf"])
	) {
		const rabin = repiIndexedToolPresent(index, "rabin2")
			? `rabin2 -I ${target} 2>/dev/null | grep -Ei 'canary|nx|pic|relro|stripped|arch|bits' || true`
			: "";
		const readelf = `readelf -hW ${target}; readelf -lW ${target} 2>/dev/null | grep -Ei 'GNU_STACK|GNU_RELRO' || true`;
		return { label, command: [rabin, readelf].filter(Boolean).join("; "), evidence };
	}
	if (
		missingTools.includes("rabin2") &&
		target !== "<TARGET>" &&
		replacementIfToolsAvailable(index, ["readelf", "objdump"])
	) {
		return {
			label,
			command: `readelf -hW ${target}; readelf -sW ${target} 2>/dev/null | head -160; objdump -T ${target} 2>/dev/null | head -120`,
			evidence,
		};
	}
	if (
		(missingTools.includes("r2") || missingTools.includes("radare2")) &&
		target !== "<TARGET>" &&
		replacementIfToolsAvailable(index, ["strings", "objdump", "readelf"])
	) {
		return {
			label,
			command: [
				`strings -a -n 5 ${target} | grep -iE 'license|serial|key|valid|invalid|check|verify|strcmp|memcmp|flag|pass|fail' | head -160`,
				`objdump -d -Mintel ${target} 2>/dev/null | grep -iE 'strcmp|memcmp|strncmp|license|serial|key|valid|invalid' -C 8 | head -220 || true`,
				`readelf -sW ${target} 2>/dev/null | grep -iE 'main|strcmp|memcmp|license|verify|check' | head -120 || true`,
			].join("; "),
			evidence,
		};
	}
	if (missingTools.includes("ltrace") && target !== "<TARGET>" && replacementIfToolsAvailable(index, ["strace"])) {
		return {
			label,
			command: `strace -f -e trace=read,write,openat,execve -s 256 ${target} 2>&1 | head -180 || true`,
			evidence,
		};
	}
	if (missingTools.includes("strace") && target !== "<TARGET>") {
		return {
			label,
			command: `ldd ${target} 2>/dev/null || true; ${target} </dev/null 2>&1 | head -120 || true`,
			evidence,
		};
	}
	if (
		(missingTools.includes("gdb") || missingTools.includes("ROPgadget") || missingTools.includes("ropper")) &&
		target !== "<TARGET>" &&
		replacementIfToolsAvailable(index, ["objdump", "readelf", "r2", "radare2"])
	) {
		const r2 =
			repiIndexedToolPresent(index, "r2") || repiIndexedToolPresent(index, "radare2")
				? `r2 -q -c '/R pop;ret' ${target} 2>/dev/null | head -80 || true`
				: "";
		const objdump = repiIndexedToolPresent(index, "objdump")
			? `objdump -d ${target} 2>/dev/null | grep -E 'pop[[:space:]]*%|ret$' | head -80 || true`
			: "";
		return {
			label,
			command: [
				r2,
				objdump,
				`readelf -hW ${target} 2>/dev/null || true`,
				`echo "[native-objdump-rop] surrogate=pop/ret sample when gdb/ROPgadget missing"`,
			]
				.filter(Boolean)
				.join("; "),
			evidence: `${evidence}; gdb/ROP missing → r2/objdump pop;ret surrogate`,
		};
	}
	return undefined;
}
