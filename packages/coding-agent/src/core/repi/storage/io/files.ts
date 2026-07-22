/** Storage IO: private text file helpers. */

export {
	readTextFile,
	readTextFileCached,
	resolveReadTextFileMaxBytes,
	warnOverCap,
} from "./files-read.ts";
export { appendPrivateTextFile, chmodPrivate, writePrivateTextFile } from "./files-write.ts";
