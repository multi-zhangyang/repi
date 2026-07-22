/** Reverse-heavy auto-lane command seeding. */

import type { LaneCommand, LaneCommandPack } from "../lane-commands.ts";
import type { MissionLane, MissionState } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function seedReverseAutoLaneCommands(
	mission: MissionState,
	lane: MissionLane,
	pack: LaneCommandPack,
	target?: string,
): void {
	const routeBlob = `${pack.route} ${lane.name} ${target ?? ""}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|web_authz|frontend|js|browser|authz|web \/ api|web pentest/i.test(
			routeBlob,
		);
	if (!reverseHeavy) return;

	const t = target && !/^<|^reverse\/pentest/i.test(target) ? target : undefined;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${mission.route.domain} ${lane.name} ${target ?? ""}`,
		target: t,
		includeGates: true,
	}).slice(0, 3);
	for (const command of reverseNext) {
		pack.commands.push({
			label: "auto-reverse-domain-next",
			command,
			evidence: "reverse domain capture next",
		} as any);
	}
	const items: LaneCommand[] = [
		{
			label: "auto-reverse-domain-proof-exit",
			command: "re_domain_proof_exit show",
			evidence: "reverse runtime proof_exit gate",
		},
		{
			label: "auto-reverse-complete-audit",
			command: "re_complete audit",
			evidence: "completion requires partial/strong runtime capture",
		},
		{
			label: "auto-reverse-runtime-adapter",
			command: t ? `re_runtime_adapter run ${t}` : "re_runtime_adapter run <TARGET>",
			evidence: "runtime capture adapter",
		},
	];
	if (/frontend|js/i.test(routeBlob)) {
		items.push({
			label: "auto-reverse-js-signing",
			command: t ? `re_js_signing run ${t}` : "re_js_signing run <url-or-bundle>",
			evidence: "JS signing/hook/rebuild runtime capture",
		});
		items.push({
			label: "auto-reverse-live-browser",
			command: t ? `re_live_browser run ${t}` : "re_live_browser run <URL>",
			evidence: "browser/XHR runtime capture",
		});
	} else if (/web \/ api|web pentest|browser|authz|web_authz/i.test(routeBlob)) {
		items.push({
			label: "auto-reverse-live-browser",
			command: t ? `re_live_browser run ${t}` : "re_live_browser run <URL>",
			evidence: "browser/XHR runtime capture",
		});
		items.push({
			label: "auto-reverse-web-authz",
			command: t ? `re_web_authz_state run ${t}` : "re_web_authz_state run <URL>",
			evidence: "authz principal/object matrix capture",
		});
	} else if (/mobile/i.test(routeBlob)) {
		items.push({
			label: "auto-reverse-mobile-runtime",
			command: t ? `re_mobile_runtime run ${t}` : "re_mobile_runtime run <apk-or-package>",
			evidence: "mobile APK/Frida runtime capture",
		});
	} else if (/exploit reliability|pwn|native|binary|elf|firmware|malware/i.test(routeBlob)) {
		items.push({
			label: "auto-reverse-native-runtime",
			command: t ? `re_native_runtime run ${t}` : "re_native_runtime run <elf>",
			evidence: "native checksec/r2/ROP runtime capture",
		});
		if (/pwn|exploit/i.test(routeBlob)) {
			items.push({
				label: "auto-reverse-exploit-lab",
				command: t ? `re_exploit_lab run ${t}` : "re_exploit_lab run <PoC>",
				evidence: "exploit lab multi-run reliability capture",
			});
		}
	}
	for (const item of items) {
		if (!pack.commands.some((c: any) => c.command === item.command)) pack.commands.push(item);
	}
	pack.notes.push(
		"reverse capture: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true before claim",
	);
}
