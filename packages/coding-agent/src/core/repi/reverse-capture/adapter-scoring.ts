/** Adapter reverse capture scoring from runtime-adapter/text blobs. */
// Landmark: reverseAdapterCaptureProofFields finalizeAdapterCaptureFields bind_ready proof.exit runtime_capture_strong
// bind_ready from capture strength when not already set by explicit bind_ready=true tags
import { applyAdapterDomainCaptureSignals } from "./adapter-scoring-domains.ts";
import { finalizeAdapterCaptureFields } from "./adapter-scoring-finalize.ts";

export function reverseAdapterCaptureProofFields(text: string, lines: string[] = []): string[] {
	const out: string[] = [];
	const blob = `${text}\n${lines.join("\n")}`;
	const has = (re: RegExp) => re.test(blob);
	let signals: string[] = [];
	let confidence = 0;
	let capture = "none";
	const adapterId = /adapter[=:]\s*([a-z0-9-]+)/i.exec(blob)?.[1] || /summary\.adapter=([a-z0-9-]+)/i.exec(blob)?.[1];
	if (adapterId) {
		out.push(`summary.adapter=${adapterId}`);
		out.push(`query.adapter=${adapterId}`);
		signals.push(`adapter:${adapterId}`);
		confidence += 1;
	}
	const matchedProof = Array.from(blob.matchAll(/proof_exit_signal[s]?[=:]\s*([^\n]+)/gi)).flatMap((m: any) =>
		m[1]
			.split(/[;,|]/)
			.map((s: any) => s.trim())
			.filter(Boolean),
	);
	// Prefer explicit proof.exit= tags from adapter templates / structured capture lines
	// (e.g. proof.exit=partial_runtime_capture from command-templates). Catalog-only
	// technique.proof_exit is NOT enough for completion.
	const explicitExit =
		/proof\.exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.exec(blob)?.[1] ||
		/summary\.runtime_proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.exec(blob)?.[1] ||
		/query\.proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.exec(blob)?.[1];
	if (explicitExit) {
		capture = /runtime_capture_strong/i.test(explicitExit) ? "runtime_capture_strong" : "partial_runtime_capture";
		signals.push(`explicit_proof_exit:${capture}`);
		confidence += 4;
	}
	const bindReadyTrue = /bind_ready\s*=\s*true/i.test(blob) || /query\.bind_ready\s*=\s*true/i.test(blob);
	if (bindReadyTrue) {
		signals.push("bind_ready");
		confidence += 2;
		out.push("query.bind_ready=true");
		out.push("summary.bind_ready=true");
	}
	const parserMatched = (/parser_signals:/i.test(blob) ? 1 : 0) + (blob.match(/rank=/gi) || []).length;
	if (parserMatched) {
		signals.push("parser_signals");
		confidence += 2;
	}
	for (const pe of matchedProof.slice(0, 8)) {
		out.push(`technique.proof_exit_signal=${pe}`);
		signals.push(`proof_signal:${pe}`);
		confidence += 1;
	}
	if (has(/\[native-checksec\]|GNU_RELRO|GNU_STACK|checksec/i)) {
		signals.push("native_mitigations");
		confidence += 2;
	}
	if (has(/\[cdp-|\[browser-|xhr|websocket/i)) {
		signals.push("web_runtime");
		confidence += 2;
	}
	if (has(/frida|mobile-|apk|ipa/i)) {
		signals.push("mobile_runtime");
		confidence += 2;
	}
	if (has(/binwalk|squashfs|rootfs|firmware|\[firmware-extract\]/i)) {
		signals.push("firmware_surface");
		confidence += 1;
	}

	const domain = applyAdapterDomainCaptureSignals(has, { signals, confidence, capture });
	signals = domain.signals;
	confidence = domain.confidence;
	capture = domain.capture;

	return finalizeAdapterCaptureFields({
		out,
		signals,
		confidence,
		capture,
		adapterId,
		parserMatched,
		matchedProofLen: matchedProof.length,
		bindReadyTrue,
		blob,
	});
}
