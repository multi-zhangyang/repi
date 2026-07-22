/**
 * REPI tool bootstrap catalog (domain-split).
 * Reverse-heavy defaults prioritize checksec/gdb/r2/frida/ROPgadget/playwright for runtime capture.
 */

import { REPI_TOOL_BOOTSTRAP_CATALOG_CLOUD } from "./toolchain/cloud.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_CRYPTO } from "./toolchain/crypto.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_DFIR } from "./toolchain/dfir.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL } from "./toolchain/general.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_MOBILE } from "./toolchain/mobile.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_NATIVE } from "./toolchain/native.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG_WEB } from "./toolchain/web.ts";

export const REPI_TOOL_BOOTSTRAP_CATALOG = [
	...REPI_TOOL_BOOTSTRAP_CATALOG_NATIVE,
	...REPI_TOOL_BOOTSTRAP_CATALOG_WEB,
	...REPI_TOOL_BOOTSTRAP_CATALOG_DFIR,
	...REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL,
	...REPI_TOOL_BOOTSTRAP_CATALOG_MOBILE,
	...REPI_TOOL_BOOTSTRAP_CATALOG_CLOUD,
	...REPI_TOOL_BOOTSTRAP_CATALOG_CRYPTO,
] as const;

export type RepiToolBootstrapCatalogEntry = (typeof REPI_TOOL_BOOTSTRAP_CATALOG)[number];
