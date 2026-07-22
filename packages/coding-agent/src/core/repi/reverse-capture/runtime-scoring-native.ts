/** Domain-specific runtime reverse capture scoring. */
export type RuntimeScoreState = {
	signals: string[];
	capture: string;
	confidence: number;
	out: string[];
};

export function scoreNativeRuntimeCapture(ctx: {
	text: string;
	lines: string[];
	has: (re: RegExp) => boolean;
	count: (re: RegExp) => number;
	domain?: string;
}): RuntimeScoreState {
	const { text, lines, has, count } = ctx;
	const out: string[] = [];
	const signals: string[] = [];
	let capture = "none";
	let confidence = 0;

	const capFlag = (name: string) =>
		lines.some((l: any) => new RegExp(`summary\\.capture\\.${name}=1`, "i").test(l)) ||
		new RegExp(`\\[native-proof-capture\\][^\\n]*${name}=1`, "i").test(text);
	const checksec =
		has(/\[native-checksec\]/i) ||
		has(/\[native-readelf-program\]/i) ||
		has(/\[native-r2-mitigation\]/i) ||
		has(/GNU_STACK|GNU_RELRO|BIND_NOW/i) ||
		lines.some((l: any) => /summary\.mitigation\./i.test(l)) ||
		has(/\[native-r2\][^\n]*\bnx\b/i) ||
		capFlag("checksec");
	const binary =
		has(/\[native-binary\][^\n]*sha256=/i) ||
		lines.some((l: any) => /summary\.sha256=/i.test(l)) ||
		capFlag("binary");
	const rop = count(/\[native-ropgadget\]|\[native-ropper\]|\[native-objdump-rop\]/gi) + (capFlag("rop") ? 1 : 0);
	const symbols = has(/\[native-symbol\]|\[native-disasm\]|\[native-string\]/i) || capFlag("symbols");
	const r2 = has(/\[native-rabin-|\[native-r2\]/i) || capFlag("r2");
	const gdb = has(/\[native-gdb\]/i) || capFlag("gdb");
	const crash =
		has(/SIGSEGV|Program received signal|segmentation fault/i) ||
		has(/\[native-dyn-probe\] crash=1/i) ||
		capFlag("crash");
	const dyn =
		has(/\[native-dyn-probe\]/i) || lines.some((l: any) => /summary\.dyn_probe=1/i.test(l)) || capFlag("dyn");
	const seccomp = has(/\[native-seccomp\]/i) || capFlag("seccomp");
	const one = has(/\[native-one-gadget\]/i) || capFlag("one_gadget");
	const frida =
		has(/\[native-frida\]/i) ||
		has(/summary\.frida_host=1/i) ||
		lines.some((l: any) => /summary\.frida_host=1/i.test(l)) ||
		capFlag("frida");
	const blocked = /\[native-runtime-blocked\]\s*reason=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (binary) {
		signals.push("binary_identity");
		confidence += 1;
	}
	if (checksec) {
		signals.push("checksec_mitigations");
		confidence += 2;
	}
	if (symbols) {
		signals.push("symbol_string_triage");
		confidence += 1;
	}
	if (r2) {
		signals.push("r2_rabin_triage");
		confidence += 1;
	}
	if (rop > 0) {
		signals.push(`rop_gadgets:${rop}`);
		confidence += 2;
	}
	if (one) {
		signals.push("one_gadget");
		confidence += 1;
	}
	if (seccomp) {
		signals.push("seccomp_dump");
		confidence += 1;
	}
	if (frida) {
		signals.push("frida_host");
		confidence += 1;
	} // summary.frida_host host-presence CAP
	if (gdb) {
		signals.push("gdb_trace");
		confidence += 2;
	}
	if (crash) {
		signals.push("crash_observed");
		confidence += 2;
	}
	if (dyn) {
		signals.push("dyn_probe");
		confidence += 1;
	}
	if (blocked) {
		out.push(`summary.blocked=${blocked}`);
		out.push(`query.blocked=${blocked}`);
	}
	if (confidence >= 5 || (checksec && (rop > 0 || crash || gdb || r2))) capture = "partial_runtime_capture";
	// Strong capture without gdb when host has deep static triage (mitigations+symbols+r2+rop surrogate).
	if (
		confidence >= 8 ||
		(checksec && rop > 0 && (crash || gdb || one || dyn)) ||
		(binary && checksec && symbols && r2 && (rop > 0 || confidence >= 7)) ||
		// SO/mobile-native host path: mitigations+r2+frida without gdb still strong when ROP also present
		(binary && checksec && r2 && frida && (rop > 0 || symbols))
	) {
		capture = "runtime_capture_strong";
	}
	if (binary && checksec && confidence >= 3) {
		// Minimum native proof bar: identity + mitigations fingerprint.
		if (capture === "none") capture = "partial_runtime_capture";
	}
	// readelf+r2+symbols without checksec binary still partial
	if (capture === "none" && binary && (checksec || r2) && (symbols || rop > 0) && confidence >= 4) {
		capture = "partial_runtime_capture";
	}
	// mitigation map as first-class proof atom
	for (const key of ["nx", "pie", "relro", "canary", "fortify"]) {
		const m = lines.find((l: any) => l.toLowerCase().startsWith(`summary.mitigation.${key}=`));
		if (m) out.push(m.replace(/^summary\./i, "query."));
	}

	return { signals, capture, confidence, out };
}
