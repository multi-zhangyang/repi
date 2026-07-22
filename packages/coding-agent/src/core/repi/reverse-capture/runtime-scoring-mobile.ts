/** Domain-specific runtime reverse capture scoring. */
export type RuntimeScoreState = {
	signals: string[];
	capture: string;
	confidence: number;
	out: string[];
};

export function scoreMobileRuntimeCapture(ctx: {
	text: string;
	lines: string[];
	has: (re: RegExp) => boolean;
	count: (re: RegExp) => number;
	domain?: string;
}): RuntimeScoreState {
	const { text, lines, has, count: _count } = ctx;
	const out: string[] = [];
	const signals: string[] = [];
	let capture = "none";
	let confidence = 0;

	const capFlag = (name: string) =>
		lines.some((l: any) => new RegExp(`summary\\.capture\\.${name}=1`, "i").test(l)) ||
		new RegExp(`\\[mobile-proof-capture\\][^\\n]*${name}=1`, "i").test(text);
	const apk = has(/\[mobile-apk\]/i) || lines.some((l: any) => /summary\.apk=/i.test(l)) || capFlag("apk");
	const pin =
		has(/\[mobile-ssl-pinning\]/i) ||
		/summary\.ssl_pinning_signal=true/i.test(lines.join("\n")) ||
		capFlag("ssl_pin");
	const root =
		has(/\[mobile-root-bypass-signal\]|\[mobile-anti-debug/i) ||
		/summary\.root_debug_signal=true/i.test(lines.join("\n")) ||
		capFlag("root");
	const fridaTpl = has(/\[mobile-frida-hook-template\]|\[mobile-hook-line\]/i) || capFlag("frida");
	const attach = has(/\[mobile-attach\]/i) || capFlag("attach");
	const devices = has(/\[mobile-device\]/i) || has(/\[mobile-frida-process\]/i) || capFlag("device");
	const aapt = has(/\[mobile-aapt\]/i) || capFlag("aapt");
	const blocked = /\[mobile-runtime-blocked\]\s*reason=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (apk) {
		signals.push("apk_identity");
		confidence += 1;
	}
	if (aapt) {
		signals.push("aapt_badging");
		confidence += 1;
	}
	if (pin) {
		signals.push("ssl_pinning_strings");
		confidence += 2;
	}
	if (root) {
		signals.push("root_debug_strings");
		confidence += 2;
	}
	if (fridaTpl) {
		signals.push("frida_hook_template");
		confidence += 1;
	}
	if (devices) {
		signals.push("device_process_map");
		confidence += 1;
	}
	if (attach) {
		signals.push("frida_attach");
		confidence += 3;
	}
	if (blocked) {
		out.push(`summary.blocked=${blocked}`);
		out.push(`query.blocked=${blocked}`);
	}
	const fridaHost =
		has(/\[mobile-frida-host\]/i) || lines.some((l: any) => /summary\.frida_host=1/i.test(l)) || capFlag("frida");
	if (fridaHost && !fridaTpl) {
		signals.push("frida_host");
		confidence += 1;
	}
	if (apk && (pin || root || fridaTpl || fridaHost || aapt)) capture = "partial_runtime_capture";
	// Strong without device attach when APK identity + ssl/root signals + frida host/template + aapt/hooks are present.
	if (attach && (pin || root)) capture = "runtime_capture_strong";
	if (!attach && apk && (pin || root) && (fridaTpl || fridaHost) && (aapt || confidence >= 6)) {
		capture = "runtime_capture_strong";
	}
	if (confidence >= 7 && apk && (pin || root) && (fridaTpl || fridaHost)) {
		capture = "runtime_capture_strong";
	}

	return { signals, capture, confidence, out };
}
