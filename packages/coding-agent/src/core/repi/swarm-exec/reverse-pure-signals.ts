/** Swarm reverse query signals (pure). */
import {
	reverseAdapterCaptureProofFields,
	reverseDomainCaptureNextCommands,
	reverseTechniqueCaptureBind,
} from "../reverse-capture.ts";

export function swarmReverseQuerySignals(text: string): string[] {
	const out: string[] = [];
	const tech = /(?:query\.)?technique\s*[:=]\s*([A-Za-z0-9_./-]+)/i.exec(text)?.[1];
	const mitre = /(?:query\.)?mitre\s*[:=]\s*([A-Za-z0-9_.,T-]+)/i.exec(text)?.[1];
	const cwe = /(?:query\.)?cwe\s*[:=]\s*([A-Za-z0-9_.,-]+)/i.exec(text)?.[1];
	const proof =
		/(?:query\.)?proof_exit\s*[:=]\s*([^\n|]+)/i.exec(text)?.[1] ||
		/proof\.exit\s*=\s*([^\n|\s]+)/i.exec(text)?.[1] ||
		/summary\.runtime_proof_exit\s*=\s*([^\n|\s]+)/i.exec(text)?.[1];
	const bindReady = /(?:query\.)?bind_ready\s*[:=]\s*(true|false)/i.exec(text)?.[1];
	const captureSignals = /(?:query\.|summary\.)capture_signals\s*[:=]\s*([^\n]+)/i.exec(text)?.[1];
	if (tech) out.push(`reverse.technique=${tech.trim().slice(0, 80)}`);
	if (mitre) out.push(`reverse.mitre=${mitre.trim().slice(0, 80)}`);
	if (cwe) out.push(`reverse.cwe=${cwe.trim().slice(0, 80)}`);
	if (proof) out.push(`reverse.proof_exit=${proof.trim().slice(0, 120)}`);
	if (bindReady) out.push(`reverse.bind_ready=${bindReady.toLowerCase()}`);
	if (captureSignals) out.push(`reverse.capture_signals=${captureSignals.trim().slice(0, 160)}`);
	// Runtime capture / technique bind for reverse-heavy swarm workers (reverser bias).
	const adapterLines = reverseAdapterCaptureProofFields(text);
	for (const line of adapterLines) {
		if (/^(?:proof\.exit|query\.proof_exit|summary\.runtime_proof_exit|summary\.capture_)=/i.test(line)) {
			out.push(`reverse.${line.replace(/^(?:query|summary)\./i, "")}`);
		}
	}
	const techIds = [
		tech,
		...Array.from(text.matchAll(/\[runtime-technique\]\s*([^\n]+)/gi)).flatMap((m: any) =>
			m[1]
				.split(/[|,]/)
				.map((part: any) => part.replace(/^re_techniques show\s*/i, "").trim())
				.filter(Boolean),
		),
	]
		.filter(Boolean)
		.map((id: any) => String(id).split(/\s+|\|/)[0])
		.slice(0, 6) as string[];
	const runtimeProof =
		proof?.trim() ||
		adapterLines.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		adapterLines.find((line: any) => /^query\.proof_exit=/.test(line))?.replace(/^query\.proof_exit=/, "") ||
		"pending_runtime_capture";
	const bind = reverseTechniqueCaptureBind({
		techniqueIds: techIds,
		runtimeProofExit: runtimeProof,
	});
	for (const line of bind.lines.slice(0, 10)) {
		out.push(`reverse.${line.replace(/^bind\./, "bind_")}`);
	}
	if (bind.ready) out.push("reverse.bind_ready=true");
	else if (
		techIds.length ||
		/reverse|pwn|native|mobile|firmware|malware|checksec|gdb|rop|frida|frontend|js|browser|authz|web/i.test(text) ||
		/reverser|proof_exit|pending_runtime_capture/i.test(text)
	) {
		out.push("reverse.bind_ready=false");
		out.push("reverse.proof_gate=require_proof_exit_before_claim");
		if (!out.some((line: any) => /reverse\.proof_exit=/.test(line))) {
			out.push(`reverse.proof_exit=${runtimeProof}`);
		}
		for (const cmd of reverseDomainCaptureNextCommands({ routeOrBlob: text, includeGates: false })) {
			out.push(`reverse.next=${cmd}`);
		}
	}
	return Array.from(new Set(out)).slice(0, 24);
}
