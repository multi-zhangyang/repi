/** DFIR pure-python pcap main loop + proof rollup. */
import { DFIR_PCAP_LOOP_LINES } from "./dfir-pcap-script-loop.ts";
import { DFIR_PCAP_PROOF_LINES } from "./dfir-pcap-script-proof.ts";

export const DFIR_PCAP_MAIN_LINES = [...DFIR_PCAP_LOOP_LINES, ...DFIR_PCAP_PROOF_LINES] as const;
