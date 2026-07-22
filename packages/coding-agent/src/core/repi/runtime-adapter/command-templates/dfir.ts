/** Runtime adapter command templates: dfir. */

import { DFIR_DNS_TLS_DEEP_LINES } from "./dfir-dns-tls-deep.ts";
import { DFIR_HTTP2_SURROGATE_LINES } from "./dfir-http2-surrogate.ts";
import { DFIR_PCAP_FALLBACK_SCRIPT_LINES } from "./dfir-pcap-script.ts";
import { DFIR_PROOF_CAPTURE_FOOTER_LINES } from "./dfir-proof-footer.ts";
import { DFIR_TCPDUMP_DEEP_LINES } from "./dfir-tcpdump-deep.ts";
import { DFIR_TSHARK_HOST_LINES } from "./dfir-tshark-host.ts";

export function pcapFallbackCommandTemplate(): string {
	return [
		...DFIR_PCAP_FALLBACK_SCRIPT_LINES,
		...DFIR_TCPDUMP_DEEP_LINES,
		...DFIR_DNS_TLS_DEEP_LINES,
		...DFIR_HTTP2_SURROGATE_LINES,
		...DFIR_TSHARK_HOST_LINES,
		...DFIR_PROOF_CAPTURE_FOOTER_LINES,
	].join("\n");
}
