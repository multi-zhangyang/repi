/** Shared tool-trace ledger report/hash caches. */
import type { ToolCallTraceLedgerV1 } from "../../runtime-types/failure.ts";

export const latestToolTraceHashCache = new Map<string, string>();

/** opt #79 incremental report cache — see append/verify. */
export const toolTraceReportCache = new Map<
	string,
	{
		mtimeMs: number;
		size: number;
		report: ToolCallTraceLedgerV1;
		callIds: Set<string>;
		replayCovered: number;
		lastEventHash: string;
	}
>();

export const toolTraceVerifyState = {
	depositsSinceFullTraceVerify: 0,
};
