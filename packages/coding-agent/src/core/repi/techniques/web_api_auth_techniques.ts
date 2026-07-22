/** Technique catalog slice: web-api auth/session/ownership. */
import type { TechniqueEntry } from "./types.ts";

export const WEB_API_AUTH_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "web-jwt-confusion",
		name: "JWT algorithm confusion (RS256 → HS256 key confusion)",
		domain: "web-api",
		mitre: ["T1190", "T1550.001"],
		cwe: ["CWE-347", "CWE-287"],
		triggers:
			"Server issues RS256 JWTs and the public key is obtainable (JWKS endpoint, TLS cert, well-known), verify accepts `alg` from the token header.",
		procedure: [
			"Fetch the public key (e.g. `/jwks.json`, TLS cert `openssl x509 -pubkey -noout`), convert to PEM.",
			'Forged token header: `{"alg":"HS256","kid":"<original>"}`; sign the body with the PEM public key as the HMAC secret.',
			"If the verifier uses the same key object for both RSA verify and HMAC, it treats the public key as the HMAC secret and accepts the token.",
			"Set claims (`admin: true`, spoofed `sub`) and replay an authorized request.",
		],
		proofExit:
			"Forged token accepted by a real protected endpoint (HTTP 200 + privileged action) vs. original-token baseline; replayed request captured.",
		pitfalls: [
			"Libraries that pin the expected algorithm are immune — this only works when `alg` is trusted from the header.",
			"Key format must match exactly (PEM incl. headers); wrong newline/encoding → HMAC mismatch.",
		],
		tools: ["python3", "openssl", "curl", "jq"],
	},
	{
		id: "web-idor-bola",
		name: "IDOR / BOLA (object-level authorization bypass)",
		domain: "web-api",
		mitre: ["T1190"],
		cwe: ["CWE-639", "CWE-285"],
		triggers:
			"REST/GraphQL endpoints key objects by an attacker-controllable id (numeric, UUID, sequential), authorization checks only at router/auth level not per-object.",
		procedure: [
			"Map object identifiers: capture a normal request, vary the id (user_id, order_id, doc uuid) by ±1, replace UUIDs with a victim's leaked uuid.",
			"Two-account differential: create account A and B; from A, request B's resource id — read/update/delete without ownership.",
			"Test all verbs: GET (read), PUT/PATCH (modify), DELETE (destroy), POST (create-as-victim). GraphQL: alter the `id` arg on object queries.",
			"Check indirect references (encrypted/encoded ids) — sometimes a base64/UUID is reversible or leaks via another endpoint.",
		],
		proofExit:
			"Account A successfully reads/modifies/deletes account B's object (captured request+response), with B having never authorized A; ≥2 resources to rule out coincidence.",
		pitfalls: [
			"Rate-limited 404 ≠ IDOR — confirm the object exists for its owner first.",
			"Sequential integer ids that 404 may just be absent; need a real cross-owner read.",
			"GraphQL alias/batching can mask IDOR in audit logs but doesn't prove it — prove the cross-owner access.",
		],
		tools: ["curl", "python3", "burpsuite", "jq"],
	},
	{
		id: "web-oauth-pkce-confusion",
		name: "OAuth/OIDC PKCE and redirect_uri confusion",
		domain: "web-api",
		mitre: ["T1550", "T1528"],
		cwe: ["CWE-601", "CWE-345"],
		triggers:
			"Authorization code flow with configurable redirect_uri, missing/weak PKCE, or client_secret in SPA; token endpoint accepts cross-client codes.",
		procedure: [
			"Map authorize + token endpoints and required params (client_id, redirect_uri, code_challenge, state).",
			"Test redirect_uri allowlist: open redirect, subdomain takeover, path confusion, mixed http/https.",
			"If PKCE optional: start auth without code_challenge or with plain method; attempt code interception + redeem.",
			"Try authorization code reuse across clients; check token response for overly broad scopes.",
			"Prove impact with a captured session/token used against a victim-scoped API resource.",
		],
		proofExit:
			"Attacker-controlled redirect or missing PKCE yields a usable access token/session for another principal; evidence includes HTTP transcript hashes.",
		pitfalls: [
			"Confusing open redirect alone with account takeover — must redeem code.",
			"State not validated — CSRF on linking, separate from PKCE.",
		],
		tools: ["httpx", "curl", "mitmproxy", "browser", "jq"],
	},
];
