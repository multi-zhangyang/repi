/** Domain-specific adapter reverse capture scoring signals. */
export type { AdapterScoreState } from "./adapter-scoring-types.ts";

import { applyAdapterDfirMalwareCaptureSignals } from "./adapter-scoring-domains-dfir-malware.ts";
import { applyAdapterFirmwareCryptoAgentCaptureSignals } from "./adapter-scoring-domains-firmware-crypto-agent.ts";
import { applyAdapterOpsCaptureSignals } from "./adapter-scoring-domains-ops.ts";
import type { AdapterHasFn, AdapterScoreState } from "./adapter-scoring-types.ts";

/** Apply DFIR/PCAP/firmware/malware/crypto/agent CAP tags into score state. */
export function applyAdapterDomainCaptureSignals(has: AdapterHasFn, state: AdapterScoreState): AdapterScoreState {
	state = applyAdapterDfirMalwareCaptureSignals(has, state);
	state = applyAdapterFirmwareCryptoAgentCaptureSignals(has, state);
	return applyAdapterOpsCaptureSignals(has, state);
}
