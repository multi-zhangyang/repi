/** Mission lane packs: rev_pwn. */
import type { MissionLane } from "../types.ts";
import { lanes_crypto_stego as baseCrypto } from "./rev_pwn-crypto.ts";
import { lanes_pwn_exploit as basePwn } from "./rev_pwn-exploit.ts";
import { lanes_firmware_iot as baseFirmware } from "./rev_pwn-firmware.ts";
import { lanes_malware_analysis as baseMalware } from "./rev_pwn-malware.ts";
import { lanes_exploit_reliability as baseReliability } from "./rev_pwn-reliability.ts";
import { withReverseLaneNext } from "./rev_pwn-reverse.ts";

export function lanes_pwn_exploit(): MissionLane[] {
	return withReverseLaneNext(basePwn(), "pwn exploit native reverse");
}
export function lanes_crypto_stego(): MissionLane[] {
	return withReverseLaneNext(baseCrypto(), "crypto stego reverse");
}
export function lanes_malware_analysis(): MissionLane[] {
	return withReverseLaneNext(baseMalware(), "malware reverse ioc");
}
export function lanes_firmware_iot(): MissionLane[] {
	return withReverseLaneNext(baseFirmware(), "firmware iot reverse");
}
export function lanes_exploit_reliability(): MissionLane[] {
	return withReverseLaneNext(baseReliability(), "exploit reliability reverse");
}
