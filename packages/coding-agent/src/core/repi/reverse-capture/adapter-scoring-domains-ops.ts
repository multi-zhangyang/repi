/** Memory-forensics + cloud/identity adapter CAP scoring. */
import type { AdapterScoreState } from "./adapter-scoring-types.ts";

type HasFn = (re: RegExp) => boolean;

export function applyAdapterOpsCaptureSignals(has: HasFn, state: AdapterScoreState): AdapterScoreState {
	let { signals, confidence, capture } = state;

	// Memory forensics CAP
	if (has(/\[mem-image\]|\[memory-proof-capture\]/i)) {
		signals.push("mem_image");
		confidence += 2;
	}
	if (has(/\[mem-process\]|\[mem-pslist\]|\[mem-netscan\]|\[mem-vol\]/i)) {
		signals.push("mem_process");
		confidence += 2;
	}
	if (has(/\[mem-credential\]|\[mem-vol-credential\]/i)) {
		signals.push("mem_credential");
		confidence += 2;
	}
	if (has(/\[mem-timeline\]|\[mem-carve\]|\[mem-vol-timeline\]/i)) {
		signals.push("mem_timeline");
		confidence += 1;
	}
	if (has(/\[memory-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
		capture = "runtime_capture_strong";
		signals.push("mem_explicit_strong");
		confidence += 2;
	} else if (has(/\[memory-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
		capture = "partial_runtime_capture";
		signals.push("mem_explicit_partial");
		confidence += 1;
	}

	// Cloud / identity CAP
	if (has(/\[cloud-identity\]|\[cloud-proof-capture\]/i)) {
		signals.push("cloud_identity");
		confidence += 2;
	}
	if (has(/\[cloud-runtime-config\]|\[cloud-metadata\]/i)) {
		signals.push("cloud_runtime");
		confidence += 2;
	}
	if (has(/\[cloud-privilege-edge\]|\[ad-graph-edge\]|\[ad-principal\]/i)) {
		signals.push("cloud_privilege");
		confidence += 1;
	}
	if (has(/\[cloud-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
		capture = "runtime_capture_strong";
		signals.push("cloud_explicit_strong");
		confidence += 2;
	} else if (has(/\[cloud-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
		capture = "partial_runtime_capture";
		signals.push("cloud_explicit_partial");
		confidence += 1;
	}

	return { signals, confidence, capture };
}
