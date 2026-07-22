/** Native structured summary mitigation + capture extras. */
import { truncateMiddle } from "../text.ts";

export function nativeSummaryMitigationAndCapture(text: string): string[] {
	const lines: string[] = [];
	// checksec common tokens
	for (const key of ["NX", "PIE", "RelRO", "Canary", "Fortify"]) {
		const re = new RegExp(`${key}\\s*[:=]\\s*([A-Za-z0-9_+-]+)`, "i");
		const m = re.exec(text);
		if (m) lines.push(`summary.mitigation.${key.toLowerCase()}=${m[1]}`);
	}
	// Fallback mitigations from readelf when checksec is absent
	if (!lines.some((l: any) => /summary\.mitigation\./i.test(l))) {
		if (/GNU_STACK/i.test(text) && /RWE|RW/i.test(text)) lines.push("summary.mitigation.nx=unknown_or_disabled");
		if (/GNU_STACK/i.test(text) && /RW\s*$/im.test(text)) lines.push("summary.mitigation.nx=enabled");
		if (/GNU_RELRO/i.test(text)) lines.push("summary.mitigation.relro=present");
		if (/BIND_NOW/i.test(text)) lines.push("summary.mitigation.relro=full_or_bind_now");
		if (/\bType:\s*DYN\b/i.test(text) || /\bType:\s*EXEC\b/i.test(text)) {
			lines.push(
				/\bType:\s*DYN\b/i.test(text) ? "summary.mitigation.pie=enabled" : "summary.mitigation.pie=disabled",
			);
		}
		if (lines.some((l: any) => /summary\.mitigation\./i.test(l))) lines.push("summary.mitigation.from_readelf=true");
	}
	// r2 iI mitigation map (nx/pic/canary/relro) when checksec/readelf partial
	if (!lines.some((l: any) => /summary\.mitigation\.nx=/i.test(l))) {
		const nx =
			/\[native-r2-mitigation\]\s*nx=(\S+)/i.exec(text)?.[1] || /\[native-r2\]\s*nx\s+(\S+)/i.exec(text)?.[1];
		if (nx) lines.push(`summary.mitigation.nx=${/true|yes|1/i.test(nx) ? "yes" : nx}`);
	}
	if (!lines.some((l: any) => /summary\.mitigation\.pie=/i.test(l))) {
		const pie =
			/\[native-r2-mitigation\]\s*pie=(\S+)/i.exec(text)?.[1] || /\[native-r2\]\s*pic\s+(\S+)/i.exec(text)?.[1];
		if (pie) lines.push(`summary.mitigation.pie=${/true|yes|1/i.test(pie) ? "yes" : pie}`);
	}
	if (!lines.some((l: any) => /summary\.mitigation\.canary=/i.test(l))) {
		const canary =
			/\[native-r2-mitigation\]\s*canary=(\S+)/i.exec(text)?.[1] ||
			/\[native-r2\]\s*canary\s+(\S+)/i.exec(text)?.[1];
		if (canary) lines.push(`summary.mitigation.canary=${/true|yes|1/i.test(canary) ? "yes" : canary}`);
	}
	if (!lines.some((l: any) => /summary\.mitigation\.relro=/i.test(l))) {
		const relro =
			/\[native-r2-mitigation\]\s*relro=(\S+)/i.exec(text)?.[1] || /\[native-r2\]\s*relro\s+(\S+)/i.exec(text)?.[1];
		if (relro) lines.push(`summary.mitigation.relro=${relro}`);
	}
	if (
		lines.some((l: any) => /summary\.mitigation\./i.test(l)) &&
		!lines.some((l: any) => /from_readelf|from_r2/i.test(l))
	) {
		if (/\[native-r2/i.test(text)) lines.push("summary.mitigation.from_r2=true");
	}
	const needed = [...text.matchAll(/\[native-readelf-dynamic\][^\n]*NEEDED[^\n]*\[([^\]]+)\]/gi)].map(
		(m: any) => m[1],
	);
	if (needed.length) lines.push(`summary.needed=${needed.slice(0, 8).join(",")}`);
	const _imports = [...text.matchAll(/\[native-symbol\][^\n]*?(\w+)\s*$/gm)].map((m: any) => m[1]);
	// better: grab symbol names from objdump -T lines
	const syms = [...text.matchAll(/\[native-symbol\][^\n]*\s([A-Za-z_][\w.@-]*)\s*$/gm)].map((m: any) => m[1]);
	const interesting = Array.from(
		new Set(
			syms.filter((s: any) => /strcmp|strncmp|memcmp|system|gets|execve|printf|malloc|free|read|write/i.test(s)),
		),
	).slice(0, 12);
	if (interesting.length) lines.push(`summary.symbols=${interesting.join(",")}`);
	const rop = (text.match(/\[native-ropgadget\]|\[native-ropper\]|\[native-objdump-rop\]/gi) || []).length;
	if (rop) lines.push(`summary.rop_gadget_lines=${rop}`);
	const one = (text.match(/\[native-one-gadget\]/gi) || []).length;
	if (one) lines.push(`summary.one_gadget_lines=${one}`);
	const seccomp = (text.match(/\[native-seccomp\]/gi) || []).length;
	if (seccomp) lines.push(`summary.seccomp_lines=${seccomp}`);
	const objdumpRop = (text.match(/\[native-objdump-rop\]/gi) || []).length;
	if (objdumpRop) lines.push(`summary.objdump_rop_lines=${objdumpRop}`);
	const fridaHost = /\[native-frida\]/i.test(text);
	if (fridaHost) {
		const ver = /\[native-frida\][^\n]*version=([^\n]+)/i.exec(text)?.[1]?.trim();
		lines.push(`summary.frida_host=1`);
		if (ver) lines.push(`summary.frida_version=${truncateMiddle(ver, 80)}`);
	}
	const crash = /SIGSEGV|Program received signal|segmentation fault|\[native-dyn-probe\] crash=1/i.test(text);
	if (crash) lines.push("summary.crash=true");
	const dyn = /\[native-dyn-probe\]/i.test(text);
	if (dyn) {
		const dynExit = /\[native-dyn-probe\][^\n]*exit=(\S+)/i.exec(text)?.[1];
		lines.push("summary.dyn_probe=1");
		if (dynExit) lines.push(`summary.dyn_exit=${dynExit}`);
		const dynExact = /\[native-dyn-offset\][^\n]*exact=(\S+)/i.exec(text)?.[1];
		if (dynExact) lines.push(`summary.dyn_exact_offset=${dynExact}`);
		if (/\[native-dyn-probe\][^\n]*crash=1/i.test(text)) lines.push("summary.dyn_crash=1");
	}
	const blocked = /\[native-runtime-blocked\]\s*reason=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (blocked) lines.push(`summary.blocked=${blocked}`);
	const tech = /\[native-technique\]\s*(.+)/i.exec(text)?.[1]?.trim();
	if (tech) lines.push(`summary.technique=${truncateMiddle(tech, 200)}`);
	const arch =
		/\[native-readelf-header\][^\n]*Machine:\s*([^\n]+)/i.exec(text)?.[1]?.trim() ||
		/\[native-binary\][^\n]*file=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (arch && /ELF|x86|ARM|MIPS|arch/i.test(arch)) lines.push(`summary.arch=${truncateMiddle(arch, 120)}`);
	const cap = /\[native-proof-capture\]([^\n]*)/i.exec(text)?.[1] || "";
	if (cap) {
		for (const part of cap.trim().split(/\s+/)) {
			const kv = /^([a-z_]+)=([01])$/i.exec(part);
			if (kv) lines.push(`summary.capture.${kv[1]}=${kv[2]}`);
		}
		lines.push(`summary.proof_capture=${truncateMiddle(cap.trim(), 200)}`);
	}
	return lines;
}
