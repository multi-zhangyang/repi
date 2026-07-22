/** Knowledge-graph tagging and scoring (reverse proof markers). */

export function knowledgeTags(text: string, kind: string): string[] {
	const tags = new Set<string>([kind]);
	// Reverse/pentest structured query fields from evidence ledger / reverse-io.
	if (/(?:^|\n)\s*(?:-\s*)?query\.technique\s*[:=]|\btechnique\s*[:=]\s*[A-Za-z0-9_.-]+/im.test(text))
		tags.add("reverse-technique");
	if (
		/(?:^|\n)\s*(?:-\s*)?query\.mitre\s*[:=]|\bmitre\s*[:=]\s*T\d{4}/im.test(text) ||
		/\bT\d{4}(?:\.\d{3})?\b/.test(text)
	)
		tags.add("reverse-mitre");
	if (/(?:^|\n)\s*(?:-\s*)?query\.cwe\s*[:=]|\bcwe\s*[:=]\s*CWE-\d+/im.test(text) || /\bCWE-\d+\b/i.test(text))
		tags.add("reverse-cwe");
	if (/(?:^|\n)\s*(?:-\s*)?query\.proof_exit\s*[:=]|\bproof_exit\s*[:=]/im.test(text)) tags.add("reverse-proof-exit");
	if (/bind_ready\s*[:=]\s*true/i.test(text)) tags.add("reverse-bind-ready");
	if (/pending_runtime_capture|bind_ready\s*[:=]\s*false/i.test(text)) tags.add("reverse-capture-pending");
	if (/native-runtime|mobile-runtime|exploit-lab|pwn|firmware|malware/i.test(text)) tags.add("reverse-runtime-domain");
	if (/reverse_kind\s*[:=]|structuredSummary|runtimeAnchors|technique\.proof_exit=/i.test(text))
		tags.add("reverse-structured-evidence");
	const patterns: Array<[RegExp, string]> = [
		[/decision_core|decision_artifact|objective_stack|check_pressure|operator_next_command/i, "decision-core"],
		[/exploit_chain|chain_nodes|proof_path|exploit_path|operator_queue|chain_artifact/i, "exploit-chain"],
		[/web_authz|web-authz|authorization|authz|object ownership|idor|bola|cookie|jwt|oauth|csrf/i, "web-authz-state"],
		[/websocket|fetch|xhr|cookie|jwt|idor|bola|graphql|csrf|oauth/i, "web-authz"],
		[/sign|signature|crypto|nonce|timestamp|encrypt|decrypt|subtle/i, "js-signing"],
		[/exploit_lab|exploit-lab|flake|success_rate|poc|autopwn/i, "exploit-lab"],
		[/mobile_runtime|mobile-runtime|frida|adb|apk|jni|smali|android/i, "mobile-runtime"],
		[/native_runtime|native-runtime|elf|rop|libc|gdb|crash|cyclic|one_gadget|heap|tcache|canary/i, "native-runtime"],
		[/pcap|tshark|stream|dns|tls|http object|credential/i, "pcap-dfir"],
		[/firmware|squashfs|ubifs|binwalk|rootfs|qemu|nvram/i, "firmware"],
		[/aws|azure|gcp|k8s|kubernetes|metadata|iam|rbac|serviceaccount/i, "cloud"],
		[/ldap|kerberos|ntlm|bloodhound|certipy|spn|adcs|domain/i, "identity"],
		[/malware|yara|capa|floss|ioc|c2|sandbox/i, "malware"],
		[/prompt injection|tool boundary|memory poisoning|agent|mcp/i, "agentsec"],
		[/proved|verifier|assertion|counter_evidence/i, "verification"],
		[/replay_matrix|stdout_sha256|stderr_sha256|replay_ready/i, "replay"],
		[/autofix|patch_queue|bootstrap_queue|evidence_recapture/i, "repair"],
		[
			/repi-compaction|compact_resume|compaction_auto_resume|compaction-auto-resume|re_context resume/i,
			"compact-resume",
		],
		[
			/dispatcher_feedback|dispatcher_score|dispatcher_fallback_plan|operator_feedback_runtime|autonomous_execution_budget|score_decay|dispatcher-promotion-playbook/i,
			"dispatcher-feedback",
		],
	];
	for (const [pattern, tag] of patterns) if (pattern.test(text)) tags.add(tag);
	return Array.from(tags).slice(0, 12);
}

export function knowledgeScore(kind: string, text: string): number {
	let score = 20;
	// Structured reverse evidence (technique/mitre/cwe/proof_exit) is high-signal knowledge.
	if (/(?:query\.)?technique\s*[:=]|reverse_kind\s*[:=]/i.test(text)) score += 18;
	if (/(?:query\.)?mitre\s*[:=]|\bT\d{4}(?:\.\d{3})?\b/.test(text)) score += 16;
	if (/(?:query\.)?cwe\s*[:=]|\bCWE-\d+\b/i.test(text)) score += 14;
	if (/(?:query\.)?proof_exit\s*[:=]|technique\.proof_exit=/i.test(text)) score += 20;
	if (/runtime|exit:|stdout_sha256|proved|evidence_quality|artifact:|path:|verify:/i.test(text)) score += 25;
	if (/contradiction|failed|blocked|gap|repair|autofix/i.test(text)) score += 15;
	if (/key_evidence_block|repro_commands|replay_matrix|patch_queue|worker_packets|attack_graph/i.test(text))
		score += 20;
	if (kind === "run" || kind === "replayer") score += 20;
	if (kind === "verifier" || kind === "compiler" || kind === "autofix") score += 15;
	return Math.min(100, score);
}
