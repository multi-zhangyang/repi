/**
 * Runtime adapter execution matrix.
 */

import { pcapFallbackCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

/** Runtime adapter matrix: dfir. */
export const RUNTIME_ADAPTER_DFIR_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "tshark-pcap-flow-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "pcap-dfir",
		tool: "tshark",
		fallbackTool: "python3",
		runnerKind: "shell-command",
		commandTemplate:
			"adapter-tshark-pcap-flow-runner: " +
			"printf '[pcap-target] %s\\n' <target>; file <target> 2>/dev/null | sed 's/^/[pcap-file] /'; " +
			"(command -v capinfos >/dev/null && capinfos <target> 2>/dev/null | sed 's/^/[pcap-capinfos] /' | head -80) || true; " +
			"sha256sum <target> 2>/dev/null | awk '{print \"[pcap-sha256] \"$1}'; " +
			"tshark -r <target> -q -z conv,tcp -z conv,udp -z endpoints,ip 2>/dev/null | sed 's/^/[flow-conversation] /' | head -220; " +
			"tshark -r <target> -Y 'http.request || http.response || dns || tls.handshake.extensions_server_name || ftp || smtp || imap || pop || websocket' -T fields -E header=y " +
			"-e frame.number -e frame.time_relative -e ip.src -e tcp.srcport -e udp.srcport -e ip.dst -e tcp.dstport -e udp.dstport " +
			"-e http.host -e http.request.method -e http.request.uri -e http.response.code -e http.cookie -e http.authorization " +
			"-e dns.qry.name -e dns.a -e tls.handshake.extensions_server_name 2>/dev/null | sed 's/^/[pcap-protocol] /' | head -260; " +
			"tshark -r <target> -Y 'dns.qry.name' -T fields -e frame.number -e dns.qry.name -e dns.a 2>/dev/null | sed 's/^/[dns-query] /' | head -120; " +
			"tshark -r <target> -Y 'tls.handshake.extensions_server_name' -T fields -e frame.number -e ip.dst -e tls.handshake.extensions_server_name 2>/dev/null | sed 's/^/[tls-sni] server_name=/' | head -120; " +
			"tshark -r <target> -q -z follow,http,ascii,0 2>/dev/null | sed 's/^/[http-object] /' | head -200; " +
			"tshark -r <target> -q -z follow,tcp,ascii,0 2>/dev/null | sed 's/^/[tcp-reassembly] /' | head -160; " +
			'tshark -r <target> -Y \'http.authorization || http.cookie || ftp.request.command == "PASS" || smtp.req.parameter contains "AUTH"\' -T fields ' +
			"-e frame.number -e ip.src -e ip.dst -e http.host -e http.request.uri -e http.cookie -e http.authorization 2>/dev/null | sed 's/^/[credential-timeline] /' | head -120 || true",
		fallbackCommandTemplate: pcapFallbackCommandTemplate(),
		parserRules: [
			{
				id: "parser-pcap-capinfos-hash",
				regex: "(\\[pcap-capinfos\\]|\\[pcap-sha256\\]|\\[pcap-file\\]|\\[pcap-target\\]|Number of packets|File size)",
				evidenceRank: "network",
				proofExitSignal: "flow conversation",
			},
			{
				id: "parser-tshark-conversation",
				regex: "(TCP Conversations|\\[flow-conversation\\]|<->|frames|packets=|bytes=)",
				evidenceRank: "network",
				proofExitSignal: "flow conversation",
			},
			{
				id: "parser-http-object",
				regex: "(\\[http-object\\]|HTTP|Host:|GET |POST |http\\.)",
				evidenceRank: "network",
				proofExitSignal: "follow-stream",
			},
			{
				id: "parser-tcp-reassembly",
				regex: "(\\[tcp-reassembly\\]|\\[tcp-reassembly-gap\\]|seq_order=|segments=)",
				evidenceRank: "network",
				proofExitSignal: "tcp stream reassembly",
			},
			{
				id: "parser-credential-timeline",
				regex: "(\\[credential-timeline\\]|password|token|cookie|authorization|credential)",
				evidenceRank: "network",
				proofExitSignal: "timeline evidence",
			},
			{
				id: "parser-dns-transaction",
				regex: "(\\[dns-query\\]|\\[dns-answer\\]|qname=|txid=|dns\\.qry\\.name|DNS)",
				evidenceRank: "network",
				proofExitSignal: "dns timeline",
			},
			{
				id: "parser-tls-sni",
				regex: "(\\[tls-sni\\]|server_name=|tls\\.handshake\\.extensions_server_name|ClientHello|SNI)",
				evidenceRank: "network",
				proofExitSignal: "tls sni proof",
			},
		],
		artifactKinds: [
			"pcap-flow-conversations",
			"pcap-http-objects",
			"pcap-tcp-reassembly",
			"pcap-dns-tls-timeline",
			"runtime-adapter-transcript",
		],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"flow conversation",
			"follow-stream",
			"tcp stream reassembly",
			"timeline evidence",
			"dns timeline",
			"tls sni proof",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
