/**
 * Runtime adapter execution matrix.
 */
import type { RuntimeAdapterExecutionSpec } from "../types.ts";
import { RUNTIME_ADAPTER_NATIVE_PWN_SPECS } from "./native-pwn.ts";
import { RUNTIME_ADAPTER_NATIVE_TOOL_SPECS } from "./native-tools.ts";

/** Runtime adapter matrix: native. */
export const RUNTIME_ADAPTER_NATIVE_SPECS: RuntimeAdapterExecutionSpec[] = [
	...RUNTIME_ADAPTER_NATIVE_TOOL_SPECS,
	...RUNTIME_ADAPTER_NATIVE_PWN_SPECS,
];
