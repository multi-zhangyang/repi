/** Keep proof/bind fields when trimming reverse structured summaries. */

export function isReverseProofCriticalLine(line: string): boolean {
	return (
		/^proof\.exit=/i.test(line) ||
		/^query\.proof_exit=/i.test(line) ||
		/^summary\.runtime_proof_exit=/i.test(line) ||
		/^bind_ready=/i.test(line) ||
		/^query\.bind_ready=/i.test(line) ||
		/^summary\.bind_ready=/i.test(line) ||
		/^bind\.ready=/i.test(line) ||
		/^summary\.capture_signals=/i.test(line) ||
		/^summary\.capture_confidence=/i.test(line) ||
		/^query\.capture_signals=/i.test(line) ||
		/^query\.capture_confidence=/i.test(line) ||
		/^reverse_proof_gate=/i.test(line) ||
		/^summary\.proof_capture=/i.test(line) ||
		/^\[runtime-technique\]/i.test(line) ||
		/^summary\.technique=/i.test(line)
	);
}

/** Prefer proof/bind fields; fill remaining budget with non-critical lines. */
export function prioritizeReverseProofLines(lines: string[], max = 48): string[] {
	const unique = Array.from(new Set(lines.map((line) => String(line))));
	const critical = unique.filter((line) => isReverseProofCriticalLine(line));
	const rest = unique.filter((line) => !isReverseProofCriticalLine(line));
	const budget = Math.max(0, max - critical.length);
	return [...critical, ...rest.slice(0, budget)];
}
