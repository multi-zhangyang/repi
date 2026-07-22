/** Native symbolic CAP: pure surface + unicorn + r2/z3 + angr + qiling. */

import { NATIVE_SYMBOLIC_ANGR_LINES } from "./native-symbolic-angr.ts";
import { NATIVE_SYMBOLIC_EMU_LINES } from "./native-symbolic-emu.ts";
import { NATIVE_SYMBOLIC_QILING_LINES } from "./native-symbolic-qiling.ts";
import { NATIVE_SYMBOLIC_R2_LINES } from "./native-symbolic-r2.ts";
import { NATIVE_SYMBOLIC_SURFACE_LINES } from "./native-symbolic-surface.ts";

export const NATIVE_SYMBOLIC_HOST_LINES: string[] = [
	...NATIVE_SYMBOLIC_SURFACE_LINES,
	...NATIVE_SYMBOLIC_EMU_LINES,
	...NATIVE_SYMBOLIC_R2_LINES,
	...NATIVE_SYMBOLIC_ANGR_LINES,
	...NATIVE_SYMBOLIC_QILING_LINES,
];
