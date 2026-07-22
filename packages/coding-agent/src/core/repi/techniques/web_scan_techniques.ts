/**
 * Technique catalog slice: web-scan.
 */
import type { TechniqueEntry } from "./types.ts";

export const WEB_SCAN_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "web-httpx-tech-fingerprint",
		name: "httpx/curl technology fingerprint before crawl/templates",
		domain: "web-scan",
		mitre: ["T1595", "T1592"],
		cwe: ["CWE-200"],
		triggers:
			"New URL/host in web pentest scanning; need status, title, tech, redirects before directory brute or nuclei templates.",
		procedure: [
			"Normalize URL; confirm scope/host ownership.",
			"Baseline: `curl -k -sS -I --max-time 12 URL` for headers/server/cookies.",
			"Fingerprint: `printf URL | httpx -silent -title -tech-detect -status-code -content-length -follow-host-redirects` (fallback to curl body/title).",
			"Pull robots/sitemap lightly; do not full-crawl until baseline is recorded.",
			"Feed tech tags into template selection (WordPress/Spring/IIS) and content-discovery wordlists.",
			"Bridge: `re_lane plan scope <url>` / specialist `web-scan-httpx-tech-fingerprint` then `re_domain_proof_exit show web-scan`.",
		],
		proofExit:
			"[web-scan-httpx]/[web-scan-header]/[web-scan-scope] lines with status/title/tech; subsequent scan uses that fingerprint.",
		pitfalls: [
			"Blind nuclei against unknown stack wastes time and noise — fingerprint first.",
			"CDN/WAF may fingerprint differently per path; record both apex and app path when they diverge.",
		],
		tools: ["httpx", "curl", "whatweb", "wafw00f", "python3"],
	},
	{
		id: "webscan-content-discovery",
		name: "Content / hidden-endpoint discovery",
		domain: "web-scan",
		mitre: ["T1046", "T1190"],
		cwe: ["CWE-200", "CWE-285"],
		triggers: "Web target with undiscovered paths/APIs/admin panels; need to enumerate before deeper authz testing.",
		procedure: [
			"Wordlist + recursion: `ffuf -w wordlist -u https://t/FUZZ -mc 200,204,301,302,401,403 -recursion -recursion-depth 2`.",
			"Filter false positives by response size/words: `-fs <size>` or auto-calibrate ` -ac`.",
			"Extend with tech-specific lists (raft, seclists, API wordlists); vhost/host discovery separately.",
			"Correlate: found paths → JS files → extract endpoints/params (`linkfinder`/`jsfinder`); chain into IDOR/authz tests.",
		],
		proofExit:
			"A non-linked sensitive endpoint/admin panel is reached that isn't discoverable from the public UI, captured; ≥1 confirmed unauthenticated or cross-priv access.",
		pitfalls: [
			"403 ≠ protected — try method overrides (`X-HTTP-Method-Override: PUT`), path tricks (`/admin/.`, `/admin/..;/`), header bypass before giving up.",
			"Rate-limiting hides content (returns 429 as 404-ish); throttle and use ` -pacing`/delays.",
		],
		tools: ["ffuf", "feroxbuster", "curl", "python3", "nuclei"],
	},
	{
		id: "webscan-vhost-stack",
		name: "vHost + tech-stack fingerprint → vuln match",
		domain: "web-scan",
		mitre: ["T1046", "T1018"],
		cwe: ["CWE-200"],
		triggers:
			"Target on shared infra (one IP, many vhosts); need to map the full attack surface and pin exact versions for CVE matching.",
		procedure: [
			"vhost enum: `ffuf -w subdomains.txt -H 'Host: FUZZ.target' -u https://ip/ -fs <base-size>`; DNS/CT-log pivot (`crt.sh`, `amass`).",
			"Fingerprint: `whatweb`/`wappalyzer`/`nuclei -t technologies` → framework + version; `nmap -sV` for the port side.",
			"Match to CVEs: `searchsploit`/`nuclei -t cves`/`metasploit search` against the exact version; confirm the vuln condition (e.g. debug mode, exposed actuator) before claiming.",
			"Stack-specific checks: Spring (actuator/env), Struts2 (OGNL), Django (debug/CSRF/trusted hosts), Laravel (debug/.env), Tomcat (manager/AJP).",
		],
		proofExit:
			"A vhost/tech version pinned AND a matching known vuln condition is demonstrated exploitable on the target (captured), not just version-printed.",
		pitfalls: [
			"Version string spoofing/stale banners — verify the vuln condition itself, not just the banner.",
			"vhost 200-from-default != real host; require a size/content differential vs the default vhost.",
		],
		tools: ["ffuf", "whatweb", "nuclei", "nmap", "searchsploit"],
	},
];
