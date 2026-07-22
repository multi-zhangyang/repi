/** Native runtime plan matrices with reverse domain next. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { shellQuote } from "../target.ts";
import { nativeRuntimeShellCommand } from "./native-shell.ts";

export function nativeRuntimePlanMatrices(
	target?: string,
	timeoutMs = 12000,
): {
	binaryInventory: string[];
	mitigationMatrix: string[];
	loaderLibc: string[];
	symbolMap: string[];
	crashPlan: string[];
	breakpointPlan: string[];
	gdbTrace: string[];
	exploitScaffold: string[];
	replayCommands: string[];
	nextActions: string[];
	captureScript: string;
} {
	const captureScript = nativeRuntimeShellCommand(target, timeoutMs);
	const binaryInventory = [
		target
			? `target=${target}: file/bytes/sha256/mode/ELF interpreter inventory`
			: "target=<missing>: pass ELF/SO/native executable path",
		"collect file, stat, sha256, strings, imported symbols, exported symbols, disassembly hotspots and candidate compare/crypto sinks",
		"prefer rabin2/r2 for imports/strings; fallback readelf/objdump when r2 missing",
	];
	const mitigationMatrix = [
		"checksec/readelf: NX, PIE, RELRO, canary, GNU_STACK, BIND_NOW and interpreter",
		"map mitigations to primitive path: overflow -> crash offset, format string -> leak, heap -> allocator/tcache anchors",
		"if seccomp present: dump filter early; choose ORW/one_gadget under allowed syscalls",
	];
	const loaderLibc = [
		"ldd/readelf NEEDED captures loader/libc path and dynamic dependencies",
		"record libc/ld-linux hash when local exploit depends on offsets; pin with patchelf or container if needed",
		"one_gadget on resolved libc; annotate constraint notes in evidence",
	];
	const symbolMap = [
		"objdump/r2 symbols for strcmp/strncmp/memcmp/strstr/system/gets/read/write/malloc/free call sites",
		"strings for flag/license/key/password/debug/binsh markers and protocol prompts",
	];
	const crashPlan = [
		"generate cyclic pattern and capture crash register/stack under GDB only when REPI_NATIVE_RUN=1",
		"convert RIP/EIP/SP controlled bytes to offset, then rerun with focused breakpoint and verifier payload",
	];
	const breakpointPlan = [
		"GDB batch script breaks main and regex-breaks strcmp/strncmp/memcmp/strstr; records registers/backtrace/stack",
		"for SO/mobile-native use Frida or gdbserver attach; for foreign arch run under qemu-user with matching loader/rootfs",
	];
	const gdbTrace = [
		"${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/gdb.gdb contains bounded GDB trace script",
		"default run skips target execution; set REPI_NATIVE_RUN=1 and optional REPI_NATIVE_ARGS for live trace",
	];
	const exploitScaffold = [
		"${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/pwn-scaffold.py emits pwntools ELF context and cyclic pattern",
		"next scaffold stage: leak source -> libc/one_gadget/ROP/ret2csu/ORW -> local verifier -> exploit lab replay",
	];
	const replayCommands = [
		`re_native_runtime run ${target ?? "<elf-or-so>"} ${timeoutMs}`,
		'cat "${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/gdb.gdb"',
		'cat "${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/pwn-scaffold.py"',
		target
			? `REPI_NATIVE_RUN=1 timeout ${Math.ceil(timeoutMs / 1000)}s gdb -q -batch -x "\${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/gdb.gdb" --args ${shellQuote(target)}`
			: 'REPI_NATIVE_RUN=1 gdb -q -batch -x "${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/native}/gdb.gdb" --args <target>',
		"re_techniques show rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch",
	];
	const nextActions = Array.from(
		new Set(
			[
				target ? `re_native_runtime run ${target} ${timeoutMs}` : undefined,
				"re_lane plan primitive <target>",
				"re_techniques show rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch",
				"re_verifier matrix",
				"re_compiler draft",
				"re_exploit_lab run <poc> 5",
				"re_knowledge_graph build",
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 12);
	const planTech = reverseRuntimeTechniqueAnchor([
		"rev-checksec-fingerprint-first",
		"rev-rop-chain-ret2csu",
		"pwn-orw-seccomp-bypass",
		"native-angr-symbolic",
	]);
	const planTechActions = planTech
		? [
				`echo ${JSON.stringify(planTech)}`,
				`re_techniques show ${planTech.replace("[runtime-technique] ", "").split(" | ")[0] || "catalog"}`,
			]
		: [];
	const reverseDomainNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `native reverse pwn binary ${target ?? ""}`,
		target: target,
	}).slice(0, 4);
	const reverseProofActions = [
		...planTechActions,
		"re_domain_proof_exit show",
		"re_complete audit",
		...reverseDomainNext,
	];
	const nextActionsWithProof = Array.from(new Set([...nextActions, ...reverseProofActions])).slice(0, 16);
	return {
		binaryInventory,
		mitigationMatrix,
		loaderLibc,
		symbolMap,
		crashPlan,
		breakpointPlan,
		gdbTrace,
		exploitScaffold,
		replayCommands,
		nextActions: nextActionsWithProof,
		captureScript,
	};
}
