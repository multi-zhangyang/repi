/** Reverse-runtime shared workdir helpers. */
export function repiRuntimeWorkdirShell(subdir: string): string {
	const safe = subdir.replace(/[^a-zA-Z0-9._-]+/g, "-") || "scratch";
	return [
		'REPI_AGENT_DIR="${REPI_AGENT_DIR:-${HOME}/.repi/agent}"',
		`REPI_WORKDIR="\${REPI_RUNTIME_WORKDIR:-$REPI_AGENT_DIR/recon/runtime/${safe}}"`,
		// Prefer product reverse toolchain locations without clobbering user PATH.
		'export PATH="/opt/repi-tools/rizin:/opt/repi-tools/rizin/bin:/usr/local/bin:/usr/bin:/bin:${HOME}/.local/bin:${PATH}"',
		'mkdir -p "$REPI_WORKDIR"',
		'chmod 700 "$REPI_WORKDIR" 2>/dev/null || true',
		'echo "[repi-workdir] $REPI_WORKDIR"',
	].join("\n");
}
