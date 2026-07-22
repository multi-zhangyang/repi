/** Reverse capture marker checks for worker retry handoff closure. */
export function collectWorkerRetryHandoffReverseErrors(report: any): string[] {
	const errors: string[] = [];
	for (const worker of report.workers ?? []) {
		const blob = JSON.stringify(worker);
		if (
			/reverse|native|pwn|frida|proof_exit|technique|malware|firmware/i.test(blob) &&
			!/bind_ready|proof_exit|partial_runtime_capture|runtime_capture_strong/i.test(blob)
		) {
			errors.push(
				`retry_handoff_reverse_capture_markers_missing:${(worker as any).workerId ?? (worker as any).id ?? "worker"}`,
			);
		}
	}
	return errors;
}
