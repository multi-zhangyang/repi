/**
 * Memory deposition — product lean stubs (memory subsystem removed).
 * Keeps reverse/proof_exit auto-deposit trigger detection for factory hooks.
 */
import { truncateMiddle, uniqueNonEmpty } from "./text.ts";

export function configureMemoryDeposition(_deps: Record<string, never> = {}): void {}

export function sanitizeMemoryArtifactPaths(values?: string[], limit = 80): string[] {
	return uniqueNonEmpty((values ?? []).map((v: any) => String(v)).filter(Boolean), limit);
}

export function parseBooleanDirective(value: string | undefined): boolean | undefined {
	if (value == null) return undefined;
	const v = String(value).trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(v)) return true;
	if (["0", "false", "no", "off"].includes(v)) return false;
	return undefined;
}

export function parseMemoryAppendDirectives(_text: string): Record<string, unknown> {
	return {};
}

export function depositionBusMaxRows(): number {
	return 0;
}

export function depositionBusRotateBatch(): number {
	return 0;
}

export function rotateDepositionBusIfNeeded(): null {
	return null;
}

export function recordMemoryDepositionFromMemoryEvent(event: any): any {
	return {
		status: "disabled",
		reason: "memory subsystem removed",
		eventId: event?.id,
	};
}

/** reverse: tool auto-deposit is opt-in only; product memory surface is removed. */
export function shouldAutoDepositToolResult(
	event: any,
	text: string,
	command: string | undefined,
	settings: any = {},
): boolean {
	// Product default: no memory deposition / no mid-run memory inject.
	const mode = settings?.autoDepositMode;
	if (
		settings?.mode === "removed" ||
		settings?.mode === "off" ||
		settings?.enabled === false ||
		mode === "off" ||
		mode == null ||
		mode === undefined
	) {
		return false;
	}
	if (mode === "all") return true;
	// high-value path only when memory surface is explicitly re-enabled externally
	const haystack = `${event?.toolName ?? ""}\n${command ?? ""}\n${text}`.toLowerCase();
	if (
		/proof_exit|bind_ready|partial_runtime_capture|runtime_capture_strong|reverse_kind|domain_proof_exit|re_native_runtime|re_mobile_runtime|re_live_browser|re_js_signing|re_complete|re_domain_proof_exit/.test(
			haystack,
		)
	) {
		return true;
	}
	if (
		/^(?:re_lane|re_operator|re_verifier|re_compiler|re_replayer|re_autofix|re_proof_loop|re_swarm|re_supervisor|re_context)$/.test(
			String(event?.toolName ?? ""),
		)
	) {
		return true;
	}
	if (event?.isError) {
		return /command not found|no such file|cannot stat|modulenotfounderror|importerror|timeout|permission denied|segmentation fault|traceback|exception|blocked|failed/i.test(
			text,
		);
	}
	return /runtime-proof|verified runtime artifact|artifact|evidence|verifier|verified|replay|proof/i.test(haystack);
}

export function consolidateMemoryEvents(): string {
	return "memory_deposition:\nstatus: disabled\nnote: memory subsystem removed";
}

export function sanitizeMemoryEventRow(event: any): any | undefined {
	if (!event || typeof event !== "object") return undefined;
	return event;
}

export function formatMemoryDepositionSummary(event?: any): string {
	return truncateMiddle(`memory_deposition: disabled ${event?.id ?? ""}`.trim(), 200);
}
export { buildMemoryDepositionReport } from "./memory-stubs.ts";
