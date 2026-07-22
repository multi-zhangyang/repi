/**
 * Runtime adapter execution matrix.
 */

import { RUNTIME_ADAPTER_AGENT_SECURITY_SPECS } from "./matrix/agent-security.ts";
import { RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS } from "./matrix/cloud-identity.ts";
import { RUNTIME_ADAPTER_CRYPTO_SPECS } from "./matrix/crypto.ts";
import { RUNTIME_ADAPTER_DFIR_SPECS } from "./matrix/dfir.ts";
import { RUNTIME_ADAPTER_FIRMWARE_SPECS } from "./matrix/firmware.ts";
import { RUNTIME_ADAPTER_MALWARE_SPECS } from "./matrix/malware.ts";
import { RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS } from "./matrix/memory-forensics.ts";
import { RUNTIME_ADAPTER_MOBILE_SPECS } from "./matrix/mobile.ts";
import { RUNTIME_ADAPTER_NATIVE_SPECS } from "./matrix/native.ts";
import { RUNTIME_ADAPTER_WEB_SPECS } from "./matrix/web.ts";
import type { RuntimeAdapterExecutionSpec } from "./types.ts";

export const RUNTIME_ADAPTER_EXECUTION_MATRIX: RuntimeAdapterExecutionSpec[] = [
	...RUNTIME_ADAPTER_NATIVE_SPECS,
	...RUNTIME_ADAPTER_MOBILE_SPECS,
	...RUNTIME_ADAPTER_WEB_SPECS,
	...RUNTIME_ADAPTER_FIRMWARE_SPECS,
	...RUNTIME_ADAPTER_DFIR_SPECS,
	...RUNTIME_ADAPTER_MALWARE_SPECS,
	...RUNTIME_ADAPTER_CRYPTO_SPECS,
	...RUNTIME_ADAPTER_AGENT_SECURITY_SPECS,
	...RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS,
	...RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS,
];
export { RUNTIME_ADAPTER_AGENT_SECURITY_SPECS } from "./matrix/agent-security.ts";
export { RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS } from "./matrix/cloud-identity.ts";
export { RUNTIME_ADAPTER_CRYPTO_SPECS } from "./matrix/crypto.ts";
export { RUNTIME_ADAPTER_DFIR_SPECS } from "./matrix/dfir.ts";
export { RUNTIME_ADAPTER_FIRMWARE_SPECS } from "./matrix/firmware.ts";
export { RUNTIME_ADAPTER_MALWARE_SPECS } from "./matrix/malware.ts";
export { RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS } from "./matrix/memory-forensics.ts";
export { RUNTIME_ADAPTER_MOBILE_SPECS } from "./matrix/mobile.ts";
export { RUNTIME_ADAPTER_NATIVE_SPECS } from "./matrix/native.ts";
export { RUNTIME_ADAPTER_WEB_SPECS } from "./matrix/web.ts";
