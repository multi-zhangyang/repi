/** Specialist pack web/js want detectors. */
export function detectSpecialistWebWants(input: { domain: string; laneName: string; context: string; task: string }): {
	wantsBrowser: boolean;
	wantsWebScanner: boolean;
	wantsJsSigning: boolean;
} {
	const { domain, laneName, context, task } = input;
	void task;
	const wantsBrowser =
		domain !== "Agent / LLM boundary" &&
		/web|api|graphql|jwt|oauth|session|cookie|csrf|ssrf|idor|bola|xss|sqli|ssti|rce|browser|xhr|websocket|web\s*渗透/.test(
			context,
		) &&
		/surface|map|state|poc|runtime|proof|verify|observe|prove/.test(laneName);
	const wantsWebScanner =
		(domain === "Web pentest scanning" ||
			/漏洞扫描|目录扫描|指纹|资产发现|vuln(?:erability)? scan|web scan|nuclei|ffuf|gobuster|feroxbuster|nikto|dalfox|sqlmap|katana|crawler|crawl|waf|httpx/.test(
				context,
			)) &&
		/scope|crawl|template|scan|verify|report|surface|map|poc|prove/.test(laneName);
	const wantsJsSigning =
		/frontend|javascript|\bjs\b|签名|sign|signature|crypto|subtle|webpack|sourcemap|xhr|fetch|websocket|nonce|timestamp|encrypt|decrypt|风控/.test(
			context,
		) && /observe|map|rebuild|verify|runtime|proof|state|poc|prove/.test(laneName);

	return { wantsBrowser, wantsWebScanner, wantsJsSigning };
}
