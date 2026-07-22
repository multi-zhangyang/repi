/** Firmware + crypto + agent-security adapter CAP scoring. */
import type { AdapterHasFn, AdapterScoreState } from "./adapter-scoring-types.ts";

export function applyAdapterFirmwareCryptoAgentCaptureSignals(
	has: AdapterHasFn,
	state: AdapterScoreState,
): AdapterScoreState {
	let { signals, confidence, capture } = state;

	if (has(/\[firmware-proof-capture\]|\[rootfs-account\]|\[rootfs-service\]|\[firmware-extract\]/i)) {
		signals.push("firmware_capture");
		confidence += 2;
	}
	if (has(/\[firmware-config\]|\[firmware-secret\]|\[rootfs-config-secret\]/i)) {
		signals.push("firmware_config");
		confidence += 1;
	}
	if (has(/\[firmware-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
		capture = "runtime_capture_strong";
		signals.push("firmware_explicit_strong");
		confidence += 2;
	} else if (has(/\[firmware-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
		capture = "partial_runtime_capture";
		signals.push("firmware_explicit_partial");
		confidence += 1;
	}

	if (has(/\[crypto-param\]|\[crypto-proof-capture\]/i)) {
		signals.push("crypto_param");
		confidence += 2;
	}
	if (has(/\[crypto-transform\]/i)) {
		signals.push("crypto_transform");
		confidence += 2;
	}
	if (has(/\[crypto-solver\]|\[crypto-known-answer\]/i)) {
		signals.push("crypto_solver");
		confidence += 1;
	}
	if (has(/\[crypto-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
		capture = "runtime_capture_strong";
		signals.push("crypto_explicit_strong");
		confidence += 2;
	} else if (has(/\[crypto-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
		capture = "partial_runtime_capture";
		signals.push("crypto_explicit_partial");
		confidence += 1;
	}

	if (has(/\[agent-prompt\]|\[agent-security-proof-capture\]/i)) {
		signals.push("agent_prompt");
		confidence += 2;
	}
	if (has(/\[agent-tool\]|\[agent-tool-risk\]/i)) {
		signals.push("agent_tool");
		confidence += 2;
	}
	if (has(/\[agent-memory\]|\[agent-injection|\[agent-delegation/i)) {
		signals.push("agent_memory_inject");
		confidence += 1;
	}
	if (has(/\[agent-security-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
		capture = "runtime_capture_strong";
		signals.push("agent_explicit_strong");
		confidence += 2;
	} else if (has(/\[agent-security-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
		capture = "partial_runtime_capture";
		signals.push("agent_explicit_partial");
		confidence += 1;
	}

	return { signals, confidence, capture };
}
