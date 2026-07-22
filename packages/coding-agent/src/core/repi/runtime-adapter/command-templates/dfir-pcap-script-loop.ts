/** DFIR pure-python pcap packet loop helpers. */

import { DFIR_PCAP_FRAME_LINES } from "./dfir-pcap-script-frame.ts";
import { DFIR_PCAP_PARSER_LINES } from "./dfir-pcap-script-parsers.ts";

export const DFIR_PCAP_LOOP_LINES = [...DFIR_PCAP_PARSER_LINES, ...DFIR_PCAP_FRAME_LINES] as const;
