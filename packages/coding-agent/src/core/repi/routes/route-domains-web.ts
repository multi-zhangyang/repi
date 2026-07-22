/** Route domains: crypto/web scan/web-api. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainWeb(lower: string, _s: RouteSignals): RoutePlan | undefined {
	if (
		/(?:\bcrypto\b|cryptography|rsa|aes|cbc|ecb|gcm|nonce|iv\b|padding oracle|oracle|lattice|sage|z3|hashcat|john|xor|base64|base32|hex|modulus|exponent|elliptic|ecdsa|stego|隐写|密码题|格|同余|椭圆曲线)/.test(
			lower,
		)
	) {
		return plan(
			"Crypto / stego",
			"recover parameters, transform chain, oracle behavior, or solver path",
			"python/openssl/Z3/Sage/hashcat + known-answer replay",
			"crypto-stego",
			[
				"artifact/parameter inventory",
				"transform chain",
				"oracle/constraint model",
				"solver script",
				"known-answer replay",
			],
		);
	}
	if (
		/漏洞扫描|目录扫描|指纹|资产发现|vuln(?:erability)? scan|web scan|nuclei|ffuf|gobuster|feroxbuster|nikto|dalfox|sqlmap|waf|crawl|爬虫/.test(
			lower,
		)
	) {
		return plan(
			"Web pentest scanning",
			"turn broad web exposure into a bounded finding queue with manual replay proof",
			"httpx/katana/ffuf/nuclei/nikto/dalfox/sqlmap + curl verifier",
			"web-pentest-scan",
			["scope baseline", "crawl/route corpus", "template scan", "manual replay verifier", "finding queue/report"],
		);
	}
	if (/api|graphql|jwt|oauth|ssrf|idor|bola|xss|sqli|ssti|csrf|rce|web|burp|waf|渗透/.test(lower)) {
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
