/** Web self-heal reverse domain next. */
import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";

export function appendWebReverseHeals(params: {
	route: string;
	combined: string;
	target?: string;
	add: (label: string, command: string, evidence: string) => void;
}): void {
	if (
		!/web|api|authz|browser|js|idor|session|cookie|proof_exit|bind_ready/i.test(`${params.route} ${params.combined}`)
	) {
		return;
	}
	for (const cmd of reverseDomainCaptureNextCommands({
		routeOrBlob: `web heal ${params.route} ${params.target ?? ""}`,
		target: params.target,
		includeGates: true,
	}).slice(0, 2)) {
		params.add("web-reverse-domain-next", cmd, "reverse domain capture next");
	}
}
