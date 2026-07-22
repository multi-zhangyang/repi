/** Evidence IO helpers (bounded read, line counts, ledger rotation). */

export {
	appendText,
	rotateRuntimeEvidenceLedgerIfNeeded,
	runtimeEvidenceLedgerMaxRecords,
} from "./io-ledger.ts";
export { lineCount, lineCountStreaming } from "./io-lines.ts";
export {
	readBoundedTail,
	readTextFile,
	resolveReadTextFileMaxBytes,
} from "./io-read.ts";
export { slug, truncateMiddle } from "./io-text.ts";
