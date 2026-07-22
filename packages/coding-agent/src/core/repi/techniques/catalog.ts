/**
 * Assembled ADVANCED_TECHNIQUES catalog from domain slices.
 */

import { AGENT_LLM_TECHNIQUES } from "./agent_llm_techniques.ts";
import { CLOUD_CONTAINER_TECHNIQUES } from "./cloud_container_techniques.ts";
import { CRYPTO_STEGO_TECHNIQUES } from "./crypto_stego_techniques.ts";
import { DFIR_PCAP_TECHNIQUES } from "./dfir_pcap_techniques.ts";
import { EXPLOIT_RELIABILITY_TECHNIQUES } from "./exploit_reliability_techniques.ts";
import { FIRMWARE_IOT_TECHNIQUES } from "./firmware_iot_techniques.ts";
import { IDENTITY_AD_TECHNIQUES } from "./identity_ad_techniques.ts";
import { JS_REVERSE_TECHNIQUES } from "./js_reverse_techniques.ts";
import { MALWARE_TECHNIQUES } from "./malware_techniques.ts";
import { MEMORY_FORENSICS_TECHNIQUES } from "./memory_forensics_techniques.ts";
import { MOBILE_TECHNIQUES } from "./mobile_techniques.ts";
import { NATIVE_REVERSE_TECHNIQUES } from "./native_reverse_techniques.ts";
import { PWN_TECHNIQUES } from "./pwn_techniques.ts";
import type { TechniqueEntry } from "./types.ts";
import { WEB_API_TECHNIQUES } from "./web_api_techniques.ts";
import { WEB_SCAN_TECHNIQUES } from "./web_scan_techniques.ts";

export const ADVANCED_TECHNIQUES: readonly TechniqueEntry[] = [
	...AGENT_LLM_TECHNIQUES,
	...CLOUD_CONTAINER_TECHNIQUES,
	...CRYPTO_STEGO_TECHNIQUES,
	...DFIR_PCAP_TECHNIQUES,
	...EXPLOIT_RELIABILITY_TECHNIQUES,
	...FIRMWARE_IOT_TECHNIQUES,
	...IDENTITY_AD_TECHNIQUES,
	...JS_REVERSE_TECHNIQUES,
	...MALWARE_TECHNIQUES,
	...MEMORY_FORENSICS_TECHNIQUES,
	...MOBILE_TECHNIQUES,
	...NATIVE_REVERSE_TECHNIQUES,
	...PWN_TECHNIQUES,
	...WEB_API_TECHNIQUES,
	...WEB_SCAN_TECHNIQUES,
];
