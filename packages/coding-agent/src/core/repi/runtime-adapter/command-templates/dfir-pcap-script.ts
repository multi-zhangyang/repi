/** DFIR/PCAP host-tool fallback python script lines. */
// Landmarks (bodies in helpers/main/loop/proof): dfir-proof-capture flow-conversation dfir_pcap dfir-tls-sni-ja3-timeline parse_dns DFIR_PCAP_LOOP_LINES DFIR_PCAP_PROOF_LINES DFIR_PCAP_PARSER_LINES DFIR_PCAP_FRAME_LINES DFIR_PCAP_BASE_LINES DFIR_PCAP_DNS_TLS_LINES
import { DFIR_PCAP_HELPER_LINES } from "./dfir-pcap-script-helpers.ts";
import { DFIR_PCAP_MAIN_LINES } from "./dfir-pcap-script-main.ts";

export const DFIR_PCAP_FALLBACK_SCRIPT_LINES = [...DFIR_PCAP_HELPER_LINES, ...DFIR_PCAP_MAIN_LINES] as const;
