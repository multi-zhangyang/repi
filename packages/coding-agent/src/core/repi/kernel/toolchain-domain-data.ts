/**
 * Toolchain domain capability matrix (pure data + format).
 */
export type {
	ToolchainDomainCapabilityRowV1,
	ToolchainDomainCapabilityV1,
	ToolchainDomainSpec,
	ToolchainDomainStatus,
} from "./toolchain-domain-types.ts";

import { TOOLCHAIN_DOMAIN_MATRIX_OPS } from "./toolchain-domain-matrix-ops.ts";
import { TOOLCHAIN_DOMAIN_MATRIX_REVERSE } from "./toolchain-domain-matrix-reverse.ts";
import { TOOLCHAIN_DOMAIN_MATRIX_WEB } from "./toolchain-domain-matrix-web.ts";
import type { ToolchainDomainSpec } from "./toolchain-domain-types.ts";

export const TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX: ToolchainDomainSpec[] = [
	...TOOLCHAIN_DOMAIN_MATRIX_WEB,
	...TOOLCHAIN_DOMAIN_MATRIX_REVERSE,
	...TOOLCHAIN_DOMAIN_MATRIX_OPS,
];
