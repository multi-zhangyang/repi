/** Lazy require helper for factory session hooks. */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function requireRepiModule(relFromKernel: string): any {
	// loaders live in kernel/factory-hooks; map kernel-relative paths
	const rel = relFromKernel.startsWith("../") ? relFromKernel.replace(/^\.\.\//, "../../") : `../../${relFromKernel}`;
	return require(rel);
}
