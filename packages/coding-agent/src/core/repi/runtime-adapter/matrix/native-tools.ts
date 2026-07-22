/** Runtime adapter matrix: native tools (r2/gdb/ghidra). */
import type { RuntimeAdapterExecutionSpec } from "../types.ts";
import { RUNTIME_ADAPTER_GDB_SPEC } from "./native-tools-gdb.ts";
import { RUNTIME_ADAPTER_GHIDRA_SPEC } from "./native-tools-ghidra.ts";
import { RUNTIME_ADAPTER_R2_SPEC } from "./native-tools-r2.ts";

export const RUNTIME_ADAPTER_NATIVE_TOOL_SPECS: RuntimeAdapterExecutionSpec[] = [
	RUNTIME_ADAPTER_R2_SPEC,
	RUNTIME_ADAPTER_GDB_SPEC,
	RUNTIME_ADAPTER_GHIDRA_SPEC,
];
