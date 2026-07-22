/** Browser evidence signal collection (XHR/WS/CDP/authz anchors). */

import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";
import { collectBrowserAuthzSignals } from "./browser-signals-authz.ts";
import { collectBrowserRuntimeSignals } from "./browser-signals-runtime.ts";
import type { BrowserEvidenceSignals } from "./browser-signals-types.ts";

export type { BrowserEvidenceSignals } from "./browser-signals-types.ts";

export function collectBrowserEvidenceSignals(combined: string): BrowserEvidenceSignals {
	const findings: string[] = [];
	const runtime = collectBrowserRuntimeSignals(combined, findings);
	const authz = collectBrowserAuthzSignals(combined, findings);
	const reverseHeavy =
		runtime.idorProbeLines.length > 0 ||
		authz.authzStateLines.length > 0 ||
		authz.authzOwnershipLines.length > 0 ||
		/web-authz|authz-state|idor|bola|proof_exit|bind_ready/i.test(combined);
	if (reverseHeavy) {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `browser web_authz ${findings.join(" ")}`,
			includeGates: true,
		}).slice(0, 2);
		for (const cmd of reverseNext) findings.push(`reverse_next: ${cmd}`);
	}
	return {
		findings,
		...runtime,
		...authz,
	};
}
