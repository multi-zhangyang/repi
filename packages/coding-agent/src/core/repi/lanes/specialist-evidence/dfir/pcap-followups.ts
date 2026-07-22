/** DFIR/PCAP specialist followups + reverse capture gates. */
import type { LaneCommand } from "../../../lane-commands/types.ts";
import { pythonString } from "../helpers.ts";

export function pcapDfirEvidenceFollowups(targetArg: string, packTarget?: string): LaneCommand[] {
	return [
		{
			label: "pcap-follow-streams",
			command: `for s in 0 1 2 3 4; do echo "### tcp.stream=$s"; tshark -r ${targetArg} -q -z follow,tcp,ascii,$s 2>/dev/null | sed -n '1,120p'; done`,
			evidence: "follow high-priority TCP streams after conversation triage",
		},
		{
			label: "pcap-object-review",
			command: `find /tmp/repi-pcap-objects /tmp/repi-carve -type f 2>/dev/null | head -80 | while read -r f; do echo "### $f"; file "$f"; strings -a -n 5 "$f" | head -40; done`,
			evidence: "review carved/extracted payloads for transform chain",
		},
		{
			label: "pcap-stream-rank-rerun",
			command: `[ -f /tmp/repi-pcap-stream-rank.py ] && python3 /tmp/repi-pcap-stream-rank.py ${targetArg} || tshark -r ${targetArg} -q -z conv,tcp -z conv,udp 2>/dev/null | sed -n '1,220p'`,
			evidence: "rerun stream ranking to prioritize follow-stream extraction",
		},
		{
			label: "pcap-secret-timeline-rerun",
			command: `[ -f /tmp/repi-pcap-secret-timeline.py ] && python3 /tmp/repi-pcap-secret-timeline.py ${targetArg} || tshark -r ${targetArg} -Y 'http.authorization || http.cookie || dns.qry.name || tls.handshake.extensions_server_name || frame contains "token" || frame contains "flag"' -T fields -e frame.number -e frame.time -e ip.src -e ip.dst -e tcp.stream -e http.host -e http.request.uri -e dns.qry.name -e tls.handshake.extensions_server_name -e http.authorization -e http.cookie 2>/dev/null | head -260`,
			evidence: "rerun credential/secret timeline for high-value frames and streams",
		},
		{
			label: "pcap-transform-chain-rerun",
			command: `[ -f /tmp/repi-pcap-transform-chain.py ] && python3 /tmp/repi-pcap-transform-chain.py || find /tmp/repi-pcap-objects /tmp/repi-carve -type f 2>/dev/null | head -80 | while read -r f; do echo "### $f"; file "$f"; strings -a -n 5 "$f" | head -40; done`,
			evidence: "rerun transform-chain extractor over exported/carved artifacts",
		},
		{
			label: "pcap-dfir-report-scaffold",
			command: `python3 - <<'PY'\nimport pathlib\nprint('[pcap-dfir-report] target=' + ${pythonString(packTarget ?? "<TARGET>")})\nfor p in ['/tmp/repi-pcap-objects','/tmp/repi-carve']:\n    root=pathlib.Path(p)\n    files=list(root.rglob('*')) if root.exists() else []\n    print('[pcap-dfir-report]', p, 'files=' + str(sum(1 for f in files if f.is_file())))\nprint('Next: use pcap-stream-rank-rerun to select streams, pcap-secret-timeline-rerun for credentials, pcap-transform-chain-rerun for decoded artifacts.')\nPY`,
			evidence: "consolidated DFIR report scaffold with stream/timeline/transform next steps",
		},
	];
}

export function pcapDfirReverseCaptureFollowups(targetArg: string): LaneCommand[] {
	return [
		{
			label: `dfir-pcap-domain-proof-exit`,
			command: `re_domain_proof_exit show`,
			evidence: "reverse runtime capture gate",
		} as any,
		{
			label: `dfir-pcap-complete-audit`,
			command: `re_complete audit`,
			evidence: "reverse completion audit",
		} as any,
		{
			label: `dfir-pcap-runtime-adapter`,
			command: `re_runtime_adapter run ${targetArg}`,
			evidence: "runtime adapter capture",
		} as any,
	];
}

export function pcapDfirNextLane(counts: {
	secret: number;
	transform: number;
	flow: number;
	stream: number;
	extracted: number;
}): string | undefined {
	if (counts.secret > 0 || counts.transform > 0) return "extract/decode/report";
	if (counts.flow > 0 || counts.stream > 0 || counts.extracted > 0) return "extract/decode";
	return undefined;
}
