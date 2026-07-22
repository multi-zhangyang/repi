/** Reverse next commands for reverse-heavy repair policies. */

import { runtimeFailureCommandTarget } from "./repair-rollback-core.ts";
import type { RepairRollbackPolicyV1 } from "./repair-rollback-types.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function reverseRepairNextCommands(policy: RepairRollbackPolicyV1, target?: string): string[] {
	const blob = JSON.stringify(policy);
	if (!/(native|pwn|frida|gdb|r2|mobile|firmware|malware|proof_exit|bind_ready|elf|exploit)/i.test(blob)) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target: target ?? runtimeFailureCommandTarget(),
	}).slice(0, 4);
}
