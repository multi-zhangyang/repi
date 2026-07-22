/** DFIR proof-capture footer for runtime adapter templates. */
export const DFIR_PROOF_CAPTURE_FOOTER_LINES = [
	// Host-tool CAP rollup after pure-python pcap fallback (or tshark path).
	// Prefer pure-python proof when it already reached strong; do not clobber with partial.
	"CAP_PCAP=0; CAP_FLOW=0; CAP_HTTP=0; CAP_CRED=0; CAP_TCP=0; CAP_TLS=0; CAP_DNS=0; CAP_FILE=0; CAP_BINWALK=0; CAP_TCPDUMP=0; CAP_TSHARK=0; CAP_PACKETS=0",
	"PROOF_EXIT=pending_runtime_capture; BIND_READY=false",
	'if [ -f /tmp/repi-dfir-pcap.caps ]; then set -a; . /tmp/repi-dfir-pcap.caps; set +a; echo "[dfir-pcap-caps] loaded=1 proof.exit=${PROOF_EXIT:-pending} packets=${CAP_PACKETS:-0}"; fi',
	'if command -v file >/dev/null 2>&1 && [ -n "${1:-}" ] && [ -e "${1:-}" ]; then CAP_FILE=1; file -b "$1" 2>/dev/null | sed "s/^/[dfir-file] /"; fi',
	'if command -v tcpdump >/dev/null 2>&1 && [ -n "${1:-}" ] && [ -e "${1:-}" ]; then CAP_TCPDUMP=1; tcpdump -nn -r "$1" 2>/dev/null | head -20 | sed "s/^/[dfir-tcpdump] /"; fi',
	'if command -v tshark >/dev/null 2>&1 && [ -n "${1:-}" ] && [ -e "${1:-}" ]; then CAP_TSHARK=1; CAP_FLOW=1; tshark -r "$1" -q -z conv,tcp 2>/dev/null | head -40 | sed "s/^/[pcap-flow] /"; fi',
	'if command -v binwalk >/dev/null 2>&1 && [ -n "${1:-}" ] && [ -e "${1:-}" ]; then CAP_BINWALK=1; binwalk "$1" 2>/dev/null | head -40 | sed "s/^/[firmware-extract] /"; fi',
	'if command -v strings >/dev/null 2>&1 && [ -n "${1:-}" ] && [ -e "${1:-}" ]; then strings -a -n 6 "$1" 2>/dev/null | grep -iE "password|token|Authorization|Cookie|BEGIN |api[_-]?key" | head -40 | sed "s/^/[pcap-secret] /"; CAP_CRED=1; fi',
	'printf "[dfir-env] file=%s tcpdump=%s tshark=%s binwalk=%s strings=%s\n" "$(command -v file || true)" "$(command -v tcpdump || true)" "$(command -v tshark || true)" "$(command -v binwalk || true)" "$(command -v strings || true)"',
	'printf "[dfir-proof-capture] domain=dfir file=%s tcpdump=%s tshark=%s binwalk=%s pcap=%s flow=%s packets=%s\n" "$CAP_FILE" "$CAP_TCPDUMP" "$CAP_TSHARK" "$CAP_BINWALK" "$CAP_PCAP" "$CAP_FLOW" "$CAP_PACKETS"',
	// Final rollup: pure-python strong wins; else host-tool partial/strong.
	'if [ "${PROOF_EXIT:-}" = "runtime_capture_strong" ] || { [ "${CAP_PCAP:-0}" = "1" ] && [ "${CAP_FLOW:-0}" = "1" ] && [ "${CAP_PACKETS:-0}" != "0" ]; }; then',
	"  PROOF_EXIT=runtime_capture_strong; BIND_READY=true",
	'elif [ "${CAP_FILE:-0}" = "1" ] || [ "${CAP_PCAP:-0}" = "1" ] || [ "${CAP_TCPDUMP:-0}" = "1" ] || [ "${CAP_TSHARK:-0}" = "1" ]; then',
	"  PROOF_EXIT=partial_runtime_capture; BIND_READY=true",
	"else",
	"  PROOF_EXIT=pending_runtime_capture; BIND_READY=false",
	"fi",
	'printf "[dfir-proof-capture] proof.exit=%s bind_ready=%s note=host-tool-or-pure-python-pcap final=1\n" "$PROOF_EXIT" "$BIND_READY"',
	'printf "summary.proof_exit=%s\n" "$PROOF_EXIT"',
	'printf "summary.bind_ready=%s\n" "$BIND_READY"',
	'printf "[dfir-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run,re_lane_plan_extract\n"',
	'printf "[runtime-technique] dfir-tls-sni-ja3-timeline | dfir-stream-follow-object-carve | fw-rootfs-extract\n"',
] as const;
