/** Finalize adapter capture confidence/bind/proof.exit fields. */
export function finalizeAdapterCaptureFields(input: {
	out: string[];
	signals: string[];
	confidence: number;
	capture: string;
	adapterId?: string;
	parserMatched: number;
	matchedProofLen: number;
	bindReadyTrue: boolean;
	blob: string;
}): string[] {
	let { out, signals, confidence, capture, adapterId, parserMatched, matchedProofLen, bindReadyTrue, blob } = input;
	const missingProof = /missing_proof=([^\n]+)/i.exec(blob)?.[1]?.trim();
	if (missingProof && !/^<?none>?$/i.test(missingProof) && missingProof !== "<none>") {
		out.push(`summary.adapter_missing_proof=${missingProof.slice(0, 200)}`);
	}
	if (capture === "none") {
		if (confidence >= 7 || (adapterId && parserMatched && matchedProofLen > 0 && confidence >= 4)) {
			capture = confidence >= 8 ? "runtime_capture_strong" : "partial_runtime_capture";
		} else if (adapterId && (parserMatched || matchedProofLen > 0 || confidence >= 3)) {
			capture = "partial_runtime_capture";
		}
	} else if (capture === "partial_runtime_capture" && confidence >= 8) {
		capture = "runtime_capture_strong";
	}
	if (signals.length) {
		out.push(`summary.capture_signals=${signals.join(",")}`);
		out.push(`query.capture_signals=${signals.join(",")}`);
	}
	out.push(`summary.capture_confidence=${confidence}`);
	out.push(`query.capture_confidence=${String(confidence)}`);
	if (capture !== "none" && !bindReadyTrue) {
		signals.push("bind_ready");
		out.push("query.bind_ready=true");
		out.push("summary.bind_ready=true");
		out.push("bind_ready=true");
		out.push("bind.ready=true");
	} else if (capture === "none" && !bindReadyTrue) {
		out.push("query.bind_ready=false");
		out.push("summary.bind_ready=false");
		out.push("bind_ready=false");
	}
	if (capture === "none") {
		out.push("query.proof_exit=pending_runtime_capture");
		out.push("summary.runtime_proof_exit=pending_runtime_capture");
	} else {
		out.push(`proof.exit=${capture}`);
		out.push(`query.proof_exit=${capture}`);
		out.push(`summary.runtime_proof_exit=${capture}`);
	}
	out.push("reverse_proof_gate=require_proof_exit_before_claim");
	return Array.from(new Set(out)).slice(0, 24);
}
