/** Mission lane routing by RoutePlan domain. */

import type { RoutePlan } from "../routes.ts";
import {
	lanes_cloud_container,
	lanes_dfir_pcap_stego,
	lanes_identity_windows_ad,
	lanes_memory_forensics,
} from "./lane-packs/dfir_cloud.ts";
import { lanes_mobile_ios, lanes_native_reverse_mobile_android } from "./lane-packs/mobile_native.ts";
import { lanes_agent_llm_boundary, lanes_default } from "./lane-packs/other.ts";
import {
	lanes_crypto_stego,
	lanes_exploit_reliability,
	lanes_firmware_iot,
	lanes_malware_analysis,
	lanes_pwn_exploit,
} from "./lane-packs/rev_pwn.ts";
import { lanes_frontend_js_reverse, lanes_web_api_pentest, lanes_web_pentest_scanning } from "./lane-packs/web.ts";
import type { MissionLane } from "./types.ts";

export function missionLanesForRoute(route: RoutePlan): MissionLane[] {
	if (route.domain === "Pwn / exploit") return lanes_pwn_exploit();
	if (route.domain === "Web / API pentest") return lanes_web_api_pentest();
	if (route.domain === "Web pentest scanning") return lanes_web_pentest_scanning();
	if (route.domain === "Frontend JS reverse") return lanes_frontend_js_reverse();
	if (route.domain === "Crypto / stego") return lanes_crypto_stego();
	if (route.domain === "Malware analysis") return lanes_malware_analysis();
	if (route.domain === "Firmware / IoT") return lanes_firmware_iot();
	if (route.domain === "Exploit reliability") return lanes_exploit_reliability();
	if (route.domain === "Agent / LLM boundary") return lanes_agent_llm_boundary();
	if (route.domain === "Memory forensics") return lanes_memory_forensics();
	if (route.domain === "DFIR / PCAP / stego") return lanes_dfir_pcap_stego();
	if (route.domain === "Mobile / iOS") return lanes_mobile_ios();
	if (route.domain === "Cloud / container") return lanes_cloud_container();
	if (route.domain === "Identity / Windows / AD") return lanes_identity_windows_ad();
	if (route.domain === "Native reverse" || route.domain === "Mobile / Android")
		return lanes_native_reverse_mobile_android();
	return lanes_default(route);
}

export function initializeMissionLanes(lanes: MissionLane[]): MissionLane[] {
	const timestamp = new Date().toISOString();
	return lanes.map((lane: any, index: any) => ({
		...lane,
		status: index === 0 ? "in_progress" : "pending",
		updatedAt: timestamp,
	}));
}
