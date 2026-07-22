/** Web/browser/authz domain capture decision from scored signals. */
export function applyWebDomainCapture(input: {
	domain: "web" | "web_authz";
	has: (re: RegExp) => boolean;
	url: boolean;
	status: boolean;
	cookies: boolean;
	api: boolean;
	sm: boolean;
	scripts: boolean;
	route: boolean;
	principals: boolean;
	objects: boolean;
	seq: boolean;
	rollback: boolean;
	idor: boolean;
	confidence: number;
	signals: string[];
}): { capture: string; confidence: number; signals: string[] } {
	const { domain, has, url, status, cookies, api, sm, scripts, route, principals, objects, seq, rollback, idor } =
		input;
	let capture = "none";
	let confidence = input.confidence;
	const signals = [...input.signals];
	if (domain === "web") {
		// Successful document capture (url+status) is already a partial runtime proof bar.
		if (url && status) capture = "partial_runtime_capture";
		if ((url || status) && (cookies || api || sm || scripts)) capture = "partial_runtime_capture";
		if ((cookies || api) && (sm || idor) && confidence >= 5) capture = "runtime_capture_strong";
		if (url && status && confidence >= 2 && capture === "none") capture = "partial_runtime_capture";
		if (url && status && (api || sm || scripts) && confidence >= 4) {
			capture = "partial_runtime_capture";
			signals.push("browser_rich_partial");
		}
		if (
			url &&
			status &&
			(cookies || api || has(/\[browser-storage\]|\[browser-websocket\]/i)) &&
			(sm || scripts || api) &&
			confidence >= 5
		) {
			capture = "runtime_capture_strong";
			signals.push("browser_rich_strong");
		}
		if (has(/\[browser-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
			capture = "runtime_capture_strong";
			signals.push("browser_explicit_strong");
			confidence += 1;
		} else if (has(/\[browser-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i)) {
			// Explicit partial from capture script wins over heuristic strong when present.
			if (capture === "runtime_capture_strong" || capture === "none") {
				capture = "partial_runtime_capture";
				signals.push("browser_explicit_partial");
			}
		}
		// General honesty: captcha/challenge interstitials without organic business API are partial.
		const challengeOnly =
			has(
				/summary\.challenge_interstitial=true|summary\.proof_honesty=challenge_surface_not_business_depth|\[browser-challenge\]|note=challenge_surface_only/i,
			) &&
			!has(/summary\.organic_api=true|\[browser-organic-api\]|summary\.capture\.organic_api=1/i) &&
			!has(/\[browser-sourcemap\]|summary\.capture\.sourcemap=1/i);
		if (challengeOnly && capture === "runtime_capture_strong") {
			capture = "partial_runtime_capture";
			signals.push("browser_challenge_surface_partial");
		}
		// JS signing / frontend crypto CAP path (static JS or live HTML fetch)
		const jsCap = has(/\[js-signing-proof-capture\]/i) || has(/\[js-signing-crypto\]/i) || has(/\[repi-js-hook\]/i);
		if (jsCap && (api || sm || scripts) && confidence >= 4) {
			capture = "partial_runtime_capture";
			signals.push("js_signing_partial");
		}
		if (jsCap && api && (sm || scripts || cookies) && confidence >= 5) {
			capture = "runtime_capture_strong";
			signals.push("js_signing_strong");
		}
		if (has(/\[js-signing-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
			capture = "runtime_capture_strong";
			signals.push("js_signing_explicit_strong");
			confidence += 1;
		} else if (has(/\[js-signing-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
			capture = "partial_runtime_capture";
			signals.push("js_signing_explicit_partial");
		}
	} else {
		if (route && (principals || objects || seq)) capture = "partial_runtime_capture";
		if (principals && objects && (seq || rollback || idor)) capture = "runtime_capture_strong";
		if (route && principals && capture === "none") capture = "partial_runtime_capture";
		// Explicit proof-capture tags from authz host CAP
		if (has(/\[web-authz-proof-capture\][^\n]*proof\.exit=runtime_capture_strong/i)) {
			capture = "runtime_capture_strong";
			signals.push("authz_explicit_strong");
			confidence += 1;
		} else if (has(/\[web-authz-proof-capture\][^\n]*proof\.exit=partial_runtime_capture/i) && capture === "none") {
			capture = "partial_runtime_capture";
			signals.push("authz_explicit_partial");
		}
		// Multi-principal matrix alone can be strong when sequence present
		if (route && principals && seq && confidence >= 4) {
			capture = capture === "none" ? "partial_runtime_capture" : capture;
		}
		if (route && principals && seq && (objects || idor || rollback) && confidence >= 5) {
			capture = "runtime_capture_strong";
			signals.push("authz_matrix_strong");
		}
	}
	return { capture, confidence, signals };
}
