import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendSpecialistHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target,
		add,
		toolNames: _toolNames,
	} = ctx;

	if (
		/dfir|pcap|forensic|stego/.test(route) ||
		/\.(?:pcap|pcapng|cap)$/i.test(pack.target ?? "") ||
		packHasSpecialistSignal(pack, /pcap-flow|PCAP\/DFIR/i)
	) {
		add(
			"heal-pcap-flow-summary",
			target
				? `capinfos ${target} 2>/dev/null || file ${target}; tshark -r ${target} -q -z conv,tcp -z endpoints,ip 2>/dev/null | sed -n '1,180p'`
				: "find . -maxdepth 5 -type f \\( -iname '*.pcap' -o -iname '*.pcapng' -o -iname '*.cap' \\) -print | head -80",
			"specialist PCAP/DFIR flow summary fallback",
		);
		add(
			"heal-pcap-stream-rank",
			target
				? `[ -f /tmp/repi-pcap-stream-rank.py ] && python3 /tmp/repi-pcap-stream-rank.py ${target} || tshark -r ${target} -q -z conv,tcp -z conv,udp 2>/dev/null | sed -n '1,220p'`
				: "find . -maxdepth 5 -type f \\( -iname '*.pcap' -o -iname '*.pcapng' -o -iname '*.cap' \\) -print | head -80",
			"specialist PCAP stream ranking fallback",
		);
		add(
			"heal-pcap-secret-timeline",
			target
				? `[ -f /tmp/repi-pcap-secret-timeline.py ] && python3 /tmp/repi-pcap-secret-timeline.py ${target} || tshark -r ${target} -Y 'http.authorization || http.cookie || dns.qry.name || tls.handshake.extensions_server_name || frame contains "token" || frame contains "flag"' -T fields -e frame.number -e frame.time -e ip.src -e ip.dst -e tcp.stream -e http.host -e http.request.uri -e dns.qry.name -e tls.handshake.extensions_server_name -e http.authorization -e http.cookie 2>/dev/null | head -260`
				: 'printf "%s\n" "bind a concrete PCAP target before secret timeline heal"',
			"specialist PCAP credential/secret timeline fallback",
		);
		add(
			"heal-pcap-transform-chain",
			'[ -f /tmp/repi-pcap-transform-chain.py ] && python3 /tmp/repi-pcap-transform-chain.py || find /tmp/repi-pcap-objects /tmp/repi-carve -type f 2>/dev/null | head -80 | while read -r f; do echo "### $f"; file "$f"; strings -a -n 5 "$f" | head -40; done',
			"specialist PCAP transform-chain fallback",
		);
	}

	if (
		/memory forensics/.test(route) ||
		/\.(?:raw|vmem|mem|dmp|lime|core|crash)$/i.test(pack.target ?? "") ||
		packHasSpecialistSignal(pack, /memory-forensics|mem-image|mem-vol|mem-credential/i)
	) {
		add(
			"heal-memory-image-info",
			target
				? `[ -x /tmp/repi-memory-info.sh ] && /tmp/repi-memory-info.sh ${target} || { file ${target}; sha256sum ${target}; }`
				: "find . -maxdepth 6 -type f \\( -iname '*.raw' -o -iname '*.vmem' -o -iname '*.mem' -o -iname '*.dmp' -o -iname '*.lime' -o -iname '*.core' \\) -print | head -120",
			"specialist memory image/profile/banner fallback",
		);
		add(
			"heal-memory-process-network",
			target
				? `[ -x /tmp/repi-memory-process.sh ] && /tmp/repi-memory-process.sh ${target} || strings -a -n 8 ${target} | grep -Eai 'cmd\\.exe|powershell|/bin/sh|bash|curl|wget|http|socket|connect' | head -240`
				: 'printf "%s\n" "bind a concrete memory image before process/network heal"',
			"specialist memory process/network fallback",
		);
		add(
			"heal-memory-credential-artifact",
			target
				? `[ -x /tmp/repi-memory-creds.sh ] && /tmp/repi-memory-creds.sh ${target} || strings -a -n 6 ${target} | grep -Eai 'password|token|secret|Authorization:|Cookie:|AWS_ACCESS_KEY|BEGIN (RSA|OPENSSH)|NTLM|lsass' | head -260`
				: 'printf "%s\n" "bind a concrete memory image before credential/artifact heal"',
			"specialist memory credential/token/artifact fallback",
		);
		add(
			"heal-memory-timeline-carve",
			target
				? `[ -x /tmp/repi-memory-timeline.sh ] && /tmp/repi-memory-timeline.sh ${target} || printf '%s\n' 'rerun memory timeline/carve scaffold after volatility3 bootstrap'`
				: 'printf "%s\n" "bind a concrete memory image before timeline/carve heal"',
			"specialist memory timeline/malfind/filescan/dumpfiles fallback",
		);
	}

	if (
		/firmware|iot/.test(route) ||
		packHasSpecialistSignal(pack, /firmware-|Firmware[/]IoT rootfs|firmware-image|firmware-rootfs/i)
	) {
		add(
			"heal-firmware-extract-rootfs",
			target
				? `[ -f /tmp/repi-firmware-extract.sh ] && /tmp/repi-firmware-extract.sh ${target} || binwalk -eM ${target} 2>/dev/null || file ${target}`
				: "find . -maxdepth 6 -type f \\( -iname '*.bin' -o -iname '*.img' -o -iname '*.trx' -o -iname '*.ubi' -o -iname '*.squashfs' -o -iname '*firmware*' \\) -print | head -120",
			"specialist firmware extraction/rootfs fallback",
		);
		add(
			"heal-firmware-config-secret-map",
			"[ -f /tmp/repi-firmware-config.sh ] && /tmp/repi-firmware-config.sh || grep -RasnE 'password|passwd|secret|token|nvram|dropbear|httpd|cgi-bin' /tmp/repi-firmware-extract 2>/dev/null | head -240",
			"specialist firmware config/secret fallback",
		);
		add(
			"heal-firmware-service-surface",
			"[ -f /tmp/repi-firmware-services.sh ] && /tmp/repi-firmware-services.sh || find /tmp/repi-firmware-extract -path '*/www/*' -o -path '*/cgi-bin/*' 2>/dev/null | head -180",
			"specialist firmware service/web surface fallback",
		);
	}
}
