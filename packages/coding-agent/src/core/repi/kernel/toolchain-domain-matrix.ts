/**
 * Toolchain domain capability matrix (pure data + format).
 */
export type {
	ToolchainDomainCapabilityRowV1,
	ToolchainDomainCapabilityV1,
	ToolchainDomainSpec,
	ToolchainDomainStatus,
} from "./toolchain-domain-data.ts";
export { TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX } from "./toolchain-domain-data.ts";
export {
	buildToolchainDomainCapabilityFromIndex,
	formatToolchainDomainCapability,
} from "./toolchain-domain-format.ts";
