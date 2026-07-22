/** Specialist pack handlers: firmware/DFIR. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsPcap(ctx: SpecialistPackContext): void {
	ctx.specialists.push("PCAP/DFIR flow");
	ctx.add(
		"pcap-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[pcap-runtime-repi-bridge] target_missing\n'",
		"bridge PCAP/DFIR flow analysis to runtime adapter capture and proof.exit gates",
	);
	if (!ctx.target) {
		ctx.add(
			"pcap-flow-discover-captures",
			"find . -maxdepth 5 -type f \\( -iname '*.pcap' -o -iname '*.pcapng' -o -iname '*.cap' \\) -print | sort | head -120",
			"capture file candidates",
		);
	}
	ctx.add(
		"pcap-flow-capinfos",
		`capinfos ${ctx.targetArg} 2>/dev/null || file ${ctx.targetArg}; sha256sum ${ctx.targetArg}`,
		"PCAP metadata, time span, packet counts, and hash",
	);
	ctx.add(
		"pcap-flow-conversations",
		`tshark -r ${ctx.targetArg} -q -z conv,tcp -z conv,udp -z endpoints,ip 2>/dev/null | sed -n '1,220p'`,
		"TCP/UDP conversations and IP endpoints",
	);
	ctx.add(
		"pcap-flow-stream-rank",
		`cat > /tmp/repi-pcap-stream-rank.py <<'PY'\n#!/usr/bin/env python3\nimport collections, csv, subprocess, sys\npcap = sys.argv[1]\ncmd = ['tshark','-r',pcap,'-T','fields','-e','frame.number','-e','frame.time_epoch','-e','ip.src','-e','ip.dst','-e','tcp.stream','-e','tcp.len','-e','frame.len','-e','_ws.col.Protocol']\ntry:\n    out = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30).stdout\nexcept Exception as exc:\n    print(f'[pcap-stream-rank] error={type(exc).__name__}:{exc}')\n    sys.exit(0)\nstreams = collections.defaultdict(lambda: {'packets':0,'bytes':0,'hosts':set(),'protocols':set(),'first':None,'last':None})\nfor row in csv.reader(out.splitlines(), delimiter='\\t'):\n    if len(row) < 8 or not row[4]:\n        continue\n    frame, ts, src, dst, stream, tcp_len, frame_len, proto = row[:8]\n    item = streams[stream]\n    item['packets'] += 1\n    item['bytes'] += int(tcp_len or frame_len or 0) if (tcp_len or frame_len or '0').isdigit() else 0\n    if src: item['hosts'].add(src)\n    if dst: item['hosts'].add(dst)\n    if proto: item['protocols'].add(proto)\n    try:\n        t = float(ts)\n        item['first'] = t if item['first'] is None else min(item['first'], t)\n        item['last'] = t if item['last'] is None else max(item['last'], t)\n    except ValueError:\n        pass\nranked = sorted(streams.items(), key=lambda kv: (kv[1]['bytes'], kv[1]['packets']), reverse=True)\nfor stream, item in ranked[:30]:\n    duration = 0 if item['first'] is None or item['last'] is None else item['last'] - item['first']\n    print('[pcap-stream-rank]', 'stream=' + stream, 'packets=' + str(item['packets']), 'bytes=' + str(item['bytes']), 'duration=' + f'{duration:.3f}', 'hosts=' + ','.join(sorted(item['hosts'])[:4]), 'protocols=' + ','.join(sorted(item['protocols'])[:6]))\nPY\nchmod +x /tmp/repi-pcap-stream-rank.py\npython3 /tmp/repi-pcap-stream-rank.py ${ctx.targetArg}`,
		"rank TCP streams by bytes/packets/duration with host/protocol ctx.context",
	);
	ctx.add(
		"pcap-flow-http-dns-credentials",
		`tshark -r ${ctx.targetArg} -Y 'http.request || dns || tls.handshake.extensions_server_name || ftp || smtp || imap || pop || frame contains "password" || frame contains "token" || frame contains "flag" || frame contains "Authorization"' -T fields -e frame.number -e frame.time -e ip.src -e ip.dst -e tcp.stream -e http.host -e http.request.method -e http.request.uri -e dns.qry.name -e tls.handshake.extensions_server_name -e http.authorization -e http.cookie 2>/dev/null | head -260`,
		"HTTP/DNS/TLS SNI and credential/token/flag filters",
	);
	ctx.add(
		"pcap-follow-http-stream",
		ctx.targetLooksPcap
			? `tshark -r ${ctx.targetArg} -q -z follow,http,ascii,0 2>/dev/null | sed 's/^/[http-object] /' | head -220; tshark -r ${ctx.targetArg} -q -z follow,tcp,ascii,0 2>/dev/null | sed 's/^/[tcp-reassembly] /' | head -160`
			: `printf '[pcap-follow] target_pcap_missing\n'; find . -maxdepth 4 -type f \\( -name '*.pcap' -o -name '*.pcapng' \\) | head -20`,
		"HTTP/TCP stream follow and reassembly anchors for object extraction",
	);
	ctx.add(
		"pcap-flow-secret-timeline",
		`cat > /tmp/repi-pcap-secret-timeline.py <<'PY'\n#!/usr/bin/env python3\nimport csv, subprocess, sys\npcap = sys.argv[1]\nflt = 'http.authorization || http.cookie || http.set_cookie || ftp.request.command || ftp.request.arg || smtp.req.parameter || imap.request || pop.request || dns.qry.name || tls.handshake.extensions_server_name || frame contains "password" || frame contains "token" || frame contains "secret" || frame contains "flag" || frame contains "Authorization"'\nfields = ['frame.number','frame.time','ip.src','ip.dst','tcp.stream','http.host','http.request.method','http.request.uri','dns.qry.name','tls.handshake.extensions_server_name','http.authorization','http.cookie','http.set_cookie']\ncmd = ['tshark','-r',pcap,'-Y',flt,'-T','fields'] + sum([['-e', f] for f in fields], [])\ntry:\n    out = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30).stdout\nexcept Exception as exc:\n    print(f'[pcap-secret-timeline] error={type(exc).__name__}:{exc}')\n    sys.exit(0)\nfor row in csv.reader(out.splitlines(), delimiter='\\t'):\n    row += [''] * (len(fields) - len(row))\n    frame, time, src, dst, stream, host, method, uri, dns, sni, auth, cookie, set_cookie = row[:13]\n    values = [v for v in [host, method, uri, dns, sni, auth, cookie, set_cookie] if v]\n    if not values:\n        continue\n    print('[pcap-secret-timeline]', 'frame=' + frame, 'time=' + time, 'stream=' + stream, 'src=' + src, 'dst=' + dst, 'value=' + ' | '.join(values)[:500])\nPY\nchmod +x /tmp/repi-pcap-secret-timeline.py\npython3 /tmp/repi-pcap-secret-timeline.py ${ctx.targetArg}`,
		"timeline of DNS/SNI/HTTP auth/cookies and token/secret/flag indicators",
	);
	ctx.add(
		"pcap-flow-extract-http-objects",
		`rm -rf /tmp/repi-pcap-objects; mkdir -p /tmp/repi-pcap-objects; tshark -r ${ctx.targetArg} --export-objects http,/tmp/repi-pcap-objects 2>/dev/null || true; find /tmp/repi-pcap-objects -maxdepth 2 -type f -print -exec file {} \\; | head -160`,
		"HTTP object extraction and file type inventory",
	);
	ctx.add(
		"pcap-flow-carve-scaffold",
		`rm -rf /tmp/repi-carve; foremost -i ${ctx.targetArg} -o /tmp/repi-carve 2>/dev/null || true; find /tmp/repi-carve -maxdepth 3 -type f -print 2>/dev/null | head -160`,
		"file carving fallback for embedded payloads",
	);
	ctx.add(
		"pcap-flow-transform-chain",
		`cat > /tmp/repi-pcap-transform-chain.py <<'PY'\n#!/usr/bin/env python3\nimport base64, binascii, gzip, pathlib, re, zlib\nroots = [pathlib.Path('/tmp/repi-pcap-objects'), pathlib.Path('/tmp/repi-carve')]\nfiles = [p for root in roots if root.exists() for p in root.rglob('*') if p.is_file()]\nif not files:\n    print('[pcap-transform-chain] files=0 note=run pcap-flow-extract-http-objects/pcap-flow-carve-scaffold first')\nfor path in files[:80]:\n    data = path.read_bytes()[:1048576]\n    text = data.decode('utf-8', 'ignore')\n    hints = []\n    if re.search(r'[A-Za-z0-9+/]{32,}={0,2}', text): hints.append('base64')\n    if re.search(r'\\b[0-9a-fA-F]{32,}\\b', text): hints.append('hex')\n    if data.startswith(b'\\x1f\\x8b'): hints.append('gzip')\n    if data.startswith((b'PK\\x03\\x04', b'PK\\x05\\x06')): hints.append('zip')\n    if b'flag' in data.lower() or b'token' in data.lower() or b'password' in data.lower(): hints.append('secret-string')\n    decoded = []\n    for match in re.findall(r'[A-Za-z0-9+/]{24,}={0,2}', text)[:5]:\n        try:\n            raw = base64.b64decode(match + '=' * (-len(match) % 4), validate=False)\n            if raw and sum(32 <= b < 127 for b in raw[:80]) >= min(len(raw[:80]), 8) // 2:\n                decoded.append('base64:' + raw[:80].decode('utf-8', 'ignore').replace('\\n',' ')[:80])\n        except Exception:\n            pass\n    if data.startswith(b'\\x1f\\x8b'):\n        try: decoded.append('gzip:' + gzip.decompress(data)[:100].decode('utf-8','ignore').replace('\\n',' '))\n        except Exception: pass\n    try:\n        z = zlib.decompress(data)\n        decoded.append('zlib:' + z[:100].decode('utf-8','ignore').replace('\\n',' '))\n        hints.append('zlib')\n    except Exception:\n        pass\n    print('[pcap-transform-chain]', 'file=' + str(path), 'bytes=' + str(path.stat().st_size), 'hints=' + ','.join(sorted(set(hints))) if hints else 'hints=none', 'decoded=' + ' || '.join(decoded[:3]))\nPY\nchmod +x /tmp/repi-pcap-transform-chain.py\npython3 /tmp/repi-pcap-transform-chain.py`,
		"transform-chain extractor for carved/exported payloads: base64/hex/gzip/zlib/secret strings",
	);
}
