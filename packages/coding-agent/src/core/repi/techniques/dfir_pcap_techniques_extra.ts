/**
 * Technique catalog slice: dfir-pcap extra (beacon/C2 deep).
 */
import type { TechniqueEntry } from "./types.ts";
export const DFIR_PCAP_TECHNIQUES_EXTRA: readonly TechniqueEntry[] = [
	{
		id: "dfir-exfil-detect",
		name: "PCAP data-exfiltration + covert-channel detection",
		domain: "dfir-pcap",
		mitre: ["T1105", "T1056", "T1071.001"],
		cwe: ["CWE-319", "CWE-200"],
		triggers:
			"DFIR pcap suspected of exfil; need to find the egress channel, volume, encoding, and C2 covert transport (DNS/ICMP/HTTPS beacon).",
		procedure: [
			"Volume rank: `tshark -z conv,tcp` / `endpoints,ip` → top outbound by bytes; flag flows >> baseline. `capinfos` for capture window to compute rate.",
			"DNS exfil: `tshark -Y 'dns.qry.name' -T fields -e dns.qry.name` → high-entropy/long subdomain labels = encoded data; reassemble labels, base64/hex-decode.",
			"ICMP covert: `tshark -Y 'icmp' -T fields -e data` → data payloads in echo (normal pings carry none); reassemble.",
			"HTTPS C2: JA3/JA3S + SNI + timing (beacon interval detection via `tshark -T fields -e frame.time_relative` deltas); match to known C2 framework profiles.",
			"Carve the exfil payload: `tshark --export-objects http,dir` / `tcpflow` / `foremost` to recover the actual data sent.",
		],
		proofExit:
			"Identified an outbound channel carrying non-baseline encoded data, decoded it to meaningful content, AND pinned the timing/transport signature; reproducible from the pcap.",
		pitfalls: [
			"High volume ≠ exfil (legit CDN/backup); require the encoded/decoded payload to be meaningful.",
			"DNS label entropy alone is noisy — corroborate with query-rate spike and decodable content.",
			"TLS body is opaque without a keylog; fall back to metadata (SNI/JA3/timing) for HTTPS exfil.",
		],
		tools: ["tshark", "tcpflow", "python3", "ja3", "foremost"],
	},
	{
		id: "dfir-tls-sni-ja3-timeline",
		name: "TLS SNI/JA3 beacon timeline from PCAP",
		domain: "dfir-pcap",
		mitre: ["T1041", "T1071"],
		cwe: ["CWE-319"],
		triggers: "PCAP with encrypted C2; need host beacons without full decrypt.",
		procedure: [
			"Inventory: `capinfos cap.pcap`; extract TLS handshakes with tshark fields sni, ja3, ja3s, ip.src/dst.",
			"Build timeline of rare SNIs and periodic beacons; cluster by JA3 fingerprint.",
			"Follow high-volume streams; carve HTTP remnants and DNS for domain generation patterns.",
			"Correlate first-seen SNI with process inventory if host telemetry available.",
			"Export IOC list (domain, JA3, dst IP, interval) for containment.",
		],
		proofExit:
			"Beaconing SNI/JA3 pair with period estimate and packet evidence indices; reproducible tshark one-liner regenerates the IOC set.",
		pitfalls: [
			"Encrypted Client Hello may hide SNI — note absence, fall back to IP/JA3 only.",
			"CDN shared IPs — prefer SNI/JA3 over IP alone.",
		],
		tools: ["tshark", "capinfos", "jq", "python3"],
	},
];
