/** REPI storage default core memory seed files. */
import { repiStorageMemoryCoreBaseDefaultEntries } from "./layout-defaults-memory-core-base.ts";
import { repiStorageMemoryCoreReportDefaultEntries } from "./layout-defaults-memory-core-reports.ts";

export function repiStorageMemoryCoreDefaultEntries(): Array<[string, string]> {
	return [...repiStorageMemoryCoreBaseDefaultEntries(), ...repiStorageMemoryCoreReportDefaultEntries()];
}
