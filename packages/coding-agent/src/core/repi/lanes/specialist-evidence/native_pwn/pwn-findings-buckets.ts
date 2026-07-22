/** Pwn evidence line buckets + finding labels. */
import { interestingLines, truncateMiddle, uniqueMatches } from "../../../text.ts";

export function extractPwnEvidenceBuckets(combined: string): {
	crashLines: string[];
	crashRegisterValues: string[];
	offsetLines: string[];
	resolvedOffsets: number[];
	ropLibcLines: string[];
	verifierLines: string[];
	seccompSandboxLines: string[];
	advancedLines: string[];
	findings: string[];
} {
	const findings: string[] = [];
	const crashLines = interestingLines(
		combined,
		/SIGSEGV|segmentation fault|program received signal|RIP|EIP|RSP|RBP|registers|code=\s*-11|stack|cyclic/i,
		20,
	);
	if (crashLines.length > 0) {
		findings.push(
			`pwn primitive crash/control anchors: ${crashLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const crashRegisterValues = uniqueMatches(combined, /\b(?:RIP|EIP|PC)\s*[:=]?\s*(0x[0-9a-f]+)/gi, 8);
	if (crashRegisterValues.length > 0) findings.push(`pwn crash register anchors: ${crashRegisterValues.join(", ")}`);
	const offsetLines = interestingLines(combined, /offset[^\n]{0,80}/i, 12);
	const offsetValues = uniqueMatches(combined, /offset[^\n]{0,40}?(\d{2,5})/gi, 12);
	const resolvedOffsets = offsetValues
		.map((value: any) => Number.parseInt(value, 10))
		.filter((value: any) => Number.isFinite(value) && value > 0 && value < 100000);
	if (resolvedOffsets.length > 0) findings.push(`pwn offset candidates: ${resolvedOffsets.slice(0, 8).join(", ")}`);
	const ropLibcLines = interestingLines(
		combined,
		/\[pwn-(?:rop|libc|gadget|one.gadget)\]|ROPgadget|one_gadget|libc|system@|\/bin\/sh|pop rdi|ret2libc/i,
		16,
	);
	if (ropLibcLines.length > 0) {
		findings.push(
			`pwn ROP/libc chain anchors: ${ropLibcLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const verifierLines = interestingLines(
		combined,
		/\[pwn-(?:verify|local-verify|poc)\]|verifier|assert|flag\{|CTF/i,
		12,
	);
	if (verifierLines.length > 0) {
		findings.push(
			`pwn local verifier anchors: ${verifierLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const seccompSandboxLines = interestingLines(
		combined,
		/\[pwn-(?:seccomp|sandbox|seccomp-dump|sandbox-strace)\]|seccomp-tools|SECCOMP|prctl\(|seccomp\(|BPF|sandbox/i,
		24,
	);
	if (seccompSandboxLines.length > 0) {
		findings.push(
			`pwn seccomp/sandbox anchors: ${seccompSandboxLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const advancedLines = interestingLines(
		combined,
		/\[pwn-(?:srop|ret2dlresolve|srop-gadget)\]|SigreturnFrame|Ret2dlresolvePayload|rt_sigreturn|int 0x80|syscall/i,
		20,
	);
	if (advancedLines.length > 0) {
		findings.push(
			`pwn advanced primitive anchors: ${advancedLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	return {
		crashLines,
		crashRegisterValues,
		offsetLines,
		resolvedOffsets,
		ropLibcLines,
		verifierLines,
		seccompSandboxLines,
		advancedLines,
		findings,
	};
}
