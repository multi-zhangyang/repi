/** Route domains: memory/dfir/cloud/identity + web-target fallback. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainOps(lower: string, s: RouteSignals): RoutePlan | undefined {
	if (
		/memory dump|memdump|mem\.raw|\.vmem|hiberfil|pagefile|volatility|内存取证|内存镜像|内存转储|lsass dump|crash dump/.test(
			lower,
		)
	) {
		return plan(
			"Memory forensics",
			"recover process, network, credential, malware, and timeline evidence from memory images",
			"volatility3/file/strings/yara + timeline/carving",
			"memory-forensics",
			["image profile", "process/network map", "credential/artifact hunt", "timeline/carve", "verification/report"],
		);
	}
	if (/pcap|取证|dfir|forensic|wireshark|tshark|内存转储/.test(lower)) {
		return plan(
			"DFIR / PCAP / stego",
			"recover artifact or timeline",
			"tshark/volatility/exiftool + transform chain",
			"forensic",
			["artifact inventory", "timeline/flow map", "extract payload", "decode transform", "verify recovered data"],
		);
	}
	if (/cloud|metadata|k8s|kubernetes|docker|container|aws|azure|gcp|容器|云/.test(lower)) {
		return plan(
			"Cloud / container",
			"trace identity/runtime privilege boundary",
			"cloud CLI + container config",
			"agent-cloud",
			["identity map", "runtime config", "metadata path", "privilege edge", "pivot proof"],
		);
	}
	if (/\bad\b|kerberos|ntlm|ldap|lsass|mimikatz|bloodhound|certipy|域控|内网|横向|凭据|提权/.test(lower)) {
		return plan(
			"Identity / Windows / AD",
			"validate credential or privilege path",
			"ticket/token/SPN/SID + Impacket/NetExec",
			"identity-windows",
			["principal map", "credential usability", "privilege graph", "pivot command", "event/evidence record"],
		);
	}
	// Web-target fallback after specific domains — fix "逆向 <web target>" misroute to Native.
	if (s.webTargetSignal) {
		return plan(
			"Web / API pentest",
			"prove request/auth/state vulnerability path",
			"routes/auth/session + replay",
			"web-runtime",
			["route map", "auth/session boundary", "minimal replay", "state mutation", "PoC verification"],
		);
	}
	return undefined;
}
