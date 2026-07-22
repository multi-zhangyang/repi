/** DFIR pure-python pcap helpers: dns/tls/parsers. */
import { DFIR_PCAP_BASE_LINES } from "./dfir-pcap-script-base.ts";
import { DFIR_PCAP_DNS_TLS_LINES } from "./dfir-pcap-script-dns-tls.ts";

export const DFIR_PCAP_HELPER_LINES = [...DFIR_PCAP_BASE_LINES, ...DFIR_PCAP_DNS_TLS_LINES] as const;
