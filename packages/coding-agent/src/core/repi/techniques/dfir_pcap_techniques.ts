/**
 * Technique catalog slice: dfir-pcap.
 */

import { DFIR_PCAP_TECHNIQUES_EXTRA } from "./dfir_pcap_techniques_extra.ts";
import type { TechniqueEntry } from "./types.ts";
export const DFIR_PCAP_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "dfir-stream-follow-object-carve",
		name: "PCAP stream follow + HTTP object carve",
		domain: "dfir-pcap",
		mitre: ["T1040", "T1071.001"],
		cwe: ["CWE-319"],
		triggers:
			"PCAP/PCAPNG with HTTP or cleartext TCP streams; need reassembly, object export, and credential/timeline anchors.",
		procedure: [
			"Fingerprint capture: `file`/`capinfos`/`sha256sum`; refuse non-pcap targets.",
			"Rank flows: `tshark -q -z conv,tcp -z conv,udp -z endpoints,ip` → pick top talkers/streams.",
			"Protocol slice: filter http/dns/tls-sni; tag `[pcap-protocol]`/`[dns-query]`/`[tls-sni]`.",
			"Follow stream 0 (then top streams): `tshark -q -z follow,http,ascii,N` and `follow,tcp,ascii,N` for `[http-object]`/`[tcp-reassembly]`.",
			"Export objects: `tshark --export-objects http,/tmp/repi-pcap-objects`; `file` inventory; carve leftovers with foremost/binwalk if needed.",
			"Credential timeline: authorization/cookie/FTP PASS/SMTP AUTH filters; bridge `re_domain_proof_exit show pcap-dfir`.",
		],
		proofExit:
			"[flow-conversation]+[http-object]/[tcp-reassembly]+[credential-timeline] or exported object hashes present; DNS/SNI timeline recorded.",
		pitfalls: [
			"Following only stream 0 misses the real C2 — rank by bytes first.",
			"TLS without keylog will not yield HTTP objects; still keep SNI/JA3 and flow map as partial proof.",
		],
		tools: ["tshark", "capinfos", "tcpdump", "foremost", "file", "sha256sum"],
	},
	{
		id: "dfir-credential-pcap",
		name: "PCAP credential + C2 extraction",
		domain: "dfir-pcap",
		mitre: ["T1056", "T1071.001", "T1550.001"],
		cwe: ["CWE-319", "CWE-522"],
		triggers: "PCAP with plaintext or decryptable (TLS keylog) auth traffic; need to recover creds and C2.",
		procedure: [
			"`capinfos`/`tshark -q -z conv,tcp` → rank conversations; `tshark -Y 'http.request.method==POST' -T fields -e http.file_data` for form creds.",
			"If TLS: load `(tls.keylog_file)` (SSLKEYLOGFILE) → `tshark -o tls.keylog_file:keys.log -Y 'http2'` decrypts.",
			"C2: `tshark -z endpoints,http`/DNS frequency; JA3/JA3S fingerprinting → match known C2.",
			"Carve objects: `tshark --export-objects http,dir`; exfil detection by large outbound streams.",
		],
		proofExit:
			"Recovered credential decrypts/authenticates against the target OR C2 fingerprint matches a known family, from the captured pcap.",
		pitfalls: [
			"No keylog + TLS 1.3 PFS → no decryption; can't recover plaintext, only metadata.",
			"Credentials in HTTP basic-auth are base64 — decode; don't report the blob as the password.",
		],
		tools: ["tshark", "wireshark", "capinfos", "python3", "jq"],
	},
	{
		id: "dfir-ntlm-kerberos-extract",
		name: "PCAP NTLM/Kerberos ticket + relay extraction",
		domain: "dfir-pcap",
		mitre: ["T1550.002", "T1558", "T1056"],
		cwe: ["CWE-319", "CWE-522"],
		triggers:
			"PCAP with NTLM auth (SMB/HTTP/Exchange) or Kerberos (AS/TGS) traffic; need to recover hashes/tickets for offline crack or relay/PtH.",
		procedure: [
			"NTLM: `tshark -Y 'ntlmssp' -T fields -e ntlmssp.auth.username -e ntlmssp.auth.domain -e ntlmssp.ntlmserverchallenge -e ntlmssp.auth.ntresponse` → build `hashcat -m 5600` (NTLMv2) hash lines `user::domain:challenge:ntproof:response`.",
			"Kerberos AS-REP: `tshark -Y 'kerberos.msg_type == 10'` → capture etype + enc-part; `hashcat -m 18200` if preauth-less; `krb2john`/`kerberoast` pcap parsers for TGS.",
			"Crack offline (`hashcat`); if uncracked, the captured TGT/TGS may still be replayed (Pass-the-Ticket) via `export KRB5CCNAME=...; psexec.py -k -no-pass`.",
			"NTLM relay: if you control a position, relay the captured type-1/3 to another SMB/HTTP service (`ntlmrelayx`) — requires signing off + same-host FQDN.",
		],
		proofExit:
			"Recovered NTLMv2 hash cracks offline OR a captured TGT/TGS replays to a live service (`GetUserSPNs`/`psexec` -k succeeds); captured.",
		pitfalls: [
			"NTLMv2 needs the exact server challenge + full NTProofStr; truncated tshark fields → bad hash.",
			"Kerberos etype 18 (AES-256) tickets aren't offline-crackable; only AS-REP/TGS RC4-etype hashes are.",
			"Relay requires SMB signing disabled on the target and the same SPN; not a universal primitive.",
		],
		tools: ["tshark", "hashcat", "impacket-secretsdump", "python3", "jq"],
	},
	...DFIR_PCAP_TECHNIQUES_EXTRA,
];
