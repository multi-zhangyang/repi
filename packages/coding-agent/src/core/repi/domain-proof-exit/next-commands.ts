/** Domain proof-exit next-command assembly. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { addDomainProofExitDomainCommands } from "./next-commands-domains.ts";
// Landmark: cloud-imds-ssrf-chain | malware-config-carve | agent-prompt-surface (body in next-commands-domains.ts)

export function domainProofExitNextCommands(
	domainId: string,
	proofExit: string,
	options: { lane?: string; target?: string } = {},
): string[] {
	const lane = options.lane ?? (domainId === "pwn" ? "primitive" : domainId === "web-api" ? "state" : "prove");
	const target = options.target && !/^reverse\/pentest task$/i.test(options.target) ? options.target : "<target>";
	const suffix = target ? ` ${target}` : "";
	const commands = new Set<string>([
		`re_toolchain_domain show ${domainId}`,
		`re_lane plan ${lane}${suffix}`,
		`re_lane run ${lane}${suffix}`,
		"re_verifier matrix",
		"re_proof_loop run <target> 4 2",
	]);
	// Runtime reverse capture gate: catalog proofExit alone is never enough.
	const proofExitText = String(proofExit ?? "");
	if (/pending|partial|missing|absent|unproven|unknown/i.test(proofExitText) || !proofExitText.trim()) {
		commands.add("re_domain_proof_exit show");
		commands.add("re_complete audit");
		commands.add(`re_runtime_adapter run${suffix}`);
		// Domain-aware capture starters (avoid always suggesting native for web/js/mobile).
		if (domainId === "web-api" || domainId === "web-scan") {
			commands.add(`re_live_browser run${suffix}`);
			commands.add(`re_web_authz_state run${suffix}`);
		} else if (domainId === "frontend-js") {
			commands.add(`re_js_signing run${suffix}`);
			commands.add(`re_live_browser run${suffix}`);
		} else if (domainId === "mobile" || domainId === "mobile-ios") {
			commands.add(`re_mobile_runtime run${suffix}`);
		} else if (domainId === "exploit-reliability" || domainId === "pwn") {
			commands.add(`re_exploit_lab run${suffix}`);
			commands.add(`re_native_runtime run${suffix}`);
		} else {
			// Generic reverse-heavy: use shared domain next (covers malware/firmware/dfir/crypto/ctf).
			for (const cmd of reverseDomainCaptureNextCommands({ routeOrBlob: domainId, target })) {
				commands.add(cmd);
			}
		}
	}
	if (/bind_ready\s*=\s*false|pending_runtime_capture|reverse_proof_exit_missing/i.test(proofExitText)) {
		commands.add("re_domain_proof_exit show");
		commands.add("re_complete audit");
	}
	addDomainProofExitDomainCommands(commands, domainId, suffix);
	if (/tool|missing|bootstrap/i.test(proofExit)) commands.add("re_bootstrap plan <missing-tool>");
	return Array.from(commands).slice(0, 10);
}
