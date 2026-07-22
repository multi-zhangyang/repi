/** Specialist pack handlers: web/browser/js. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsWebScanner(ctx: SpecialistPackContext): void {
	ctx.specialists.push("web vulnerability scanner/triage");
	ctx.add(
		"web-scanner-runtime-repi-bridge",
		ctx.targetIsUrl || ctx.urlArg
			? `printf '%s\n' "re_web_authz_state run ${ctx.urlArg}" "re_live_browser run ${ctx.urlArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[web-scanner-runtime-bridge] target_missing\n'",
		"bridge web scanner work to reverse runtime proof.exit gates",
	);
	ctx.add(
		"web-scan-httpx-tech-fingerprint",
		ctx.targetIsUrl
			? `printf '%s\n' ${ctx.urlArg} | (command -v httpx >/dev/null && httpx -silent -title -tech-detect -status-code -content-length -follow-host-redirects || curl -k -sS -I --max-time 12 ${ctx.urlArg})`
			: "printf '[web-scan-httpx] target_url_missing\n'",
		"http baseline fingerprint before crawl/template scanning",
	);
	if (!ctx.target) {
		ctx.add(
			"web-scan-ctx.target-discovery",
			'rg -n "https?://|baseURL|apiUrl|NEXT_PUBLIC|VITE_|openapi|swagger|graphql|sitemap|robots" . 2>/dev/null | head -220',
			"discover concrete web/API URLs and route corpus candidates before scanning",
		);
	}
	ctx.add(
		"web-scan-scope-baseline",
		ctx.targetIsUrl
			? `cat > /tmp/repi-web-scope.sh <<'SH'\nset +e\nURL="$1"\nprintf '[web-scan-scope] url=%s\\n' "$URL"\nprintf '[web-scan-scope] host=%s\\n' "$(printf '%s' "$URL" | sed -E 's#^https?://([^/]+).*#\\1#')"\ncurl -k -sS -I --max-time 12 "$URL" | sed 's/^/[web-scan-header] /' | head -80\ncurl -k -sS --max-time 12 "$URL/robots.txt" | sed 's/^/[web-scan-robots] /' | head -80\ncurl -k -sS --max-time 12 "$URL/sitemap.xml" | sed 's/^/[web-scan-sitemap] /' | head -80\ncommand -v httpx >/dev/null 2>&1 && printf '%s\\n' "$URL" | httpx -silent -title -tech-detect -status-code -content-length -follow-host-redirects 2>/dev/null | sed 's/^/[web-scan-httpx] /'\nSH\nchmod +x /tmp/repi-web-scope.sh\n/tmp/repi-web-scope.sh ${ctx.urlArg}`
			: "printf '[web-scan-scope] target_url_missing=<URL>\\n'; rg -n \"https?://|openapi|swagger|graphql|router|route|endpoint\" . 2>/dev/null | head -220",
		"bounded web scan baseline: headers, robots/sitemap, httpx tech/status fingerprint",
	);
	ctx.add(
		"web-scan-crawl-corpus-scaffold",
		ctx.targetIsUrl
			? `cat > /tmp/repi-web-crawl.sh <<'SH'\nset +e\nURL="$1"; OUT="/tmp/repi-web-corpus.txt"; : > "$OUT"\nprintf '[web-scan-crawl] url=%s out=%s\\n' "$URL" "$OUT"\nif command -v katana >/dev/null 2>&1; then katana -silent -u "$URL" -d 2 -jc -kf all -fx 2>/dev/null | tee -a "$OUT" | sed 's/^/[web-scan-crawl] /' | head -220; fi\nfor path in /robots.txt /sitemap.xml /.well-known/security.txt /openapi.json /swagger.json /graphql; do\n  printf '%s%s\\n' "$URL" "$path" >> "$OUT"\ndone\nsort -u "$OUT" -o "$OUT"\nprintf '[web-scan-corpus] count=%s out=%s\\n' "$(wc -l < "$OUT" 2>/dev/null || echo 0)" "$OUT"\nsed -n '1,180p' "$OUT" | sed 's/^/[web-scan-corpus] /'\nSH\nchmod +x /tmp/repi-web-crawl.sh\n/tmp/repi-web-crawl.sh ${ctx.urlArg}`
			: "printf '[web-scan-crawl] target_url_missing=<URL>\\n'; rg -n \"app\\.(get|post|put|delete)|router\\.|Route\\(|@Request|graphql|openapi|swagger\" . 2>/dev/null | head -260",
		"crawl/route corpus scaffold with katana plus robots/sitemap/OpenAPI fallbacks",
	);
	ctx.add(
		"web-scan-content-discovery-scaffold",
		ctx.targetIsUrl
			? `cat > /tmp/repi-web-content.sh <<'SH'\nset +e\nURL="$1"; WORDS="/tmp/repi-web-words.txt"\ncat > "$WORDS" <<'EOF'\nadmin\napi\napi/v1\nlogin\nlogout\ndashboard\nconfig\nbackup\nuploads\nstatic\nassets\nswagger.json\nopenapi.json\ngraphql\nrobots.txt\nsitemap.xml\nEOF\nprintf '[web-scan-content] url=%s wordlist=%s\\n' "$URL" "$WORDS"\nif command -v ffuf >/dev/null 2>&1; then ffuf -u "$URL/FUZZ" -w "$WORDS" -mc all -fs 0 -t 12 -of json -o /tmp/repi-ffuf.json 2>/dev/null | sed 's/^/[web-scan-ffuf] /' | head -140; fi\nif command -v feroxbuster >/dev/null 2>&1; then feroxbuster -u "$URL" -w "$WORDS" -t 8 -n -k --json -o /tmp/repi-ferox.json 2>/dev/null | head -80 | sed 's/^/[web-scan-ferox] /'; fi\nif command -v gobuster >/dev/null 2>&1; then gobuster dir -u "$URL" -w "$WORDS" -q -k -t 8 2>/dev/null | sed 's/^/[web-scan-gobuster] /' | head -140; fi\npython3 - <<'PY'\nimport json, pathlib\nfor raw in ['/tmp/repi-ffuf.json','/tmp/repi-ferox.json']:\n    p=pathlib.Path(raw)\n    print('[web-finding-queue]', 'artifact=' + raw, 'exists=' + str(p.exists()))\nPY\nSH\nchmod +x /tmp/repi-web-content.sh\n/tmp/repi-web-content.sh ${ctx.urlArg}`
			: "printf '[web-scan-content] target_url_missing=<URL>\\n'",
		"small bounded content discovery with ffuf/feroxbuster/gobuster and artifact queue",
	);
	ctx.add(
		"web-scan-template-scan-scaffold",
		ctx.targetIsUrl
			? `cat > /tmp/repi-web-template-scan.sh <<'SH'\nset +e\nURL="$1"\nprintf '[web-scan-template] url=%s\\n' "$URL"\nif command -v nuclei >/dev/null 2>&1; then nuclei -u "$URL" -silent -rl 8 -c 4 -severity critical,high,medium -jsonl -o /tmp/repi-nuclei.jsonl 2>/dev/null | sed 's/^/[web-scan-nuclei] /' | head -180; fi\nif command -v nikto >/dev/null 2>&1; then nikto -nointeractive -Tuning x -host "$URL" 2>/dev/null | sed 's/^/[web-scan-nikto] /' | head -180; fi\nif command -v dalfox >/dev/null 2>&1; then dalfox url "$URL" --silence --skip-bav 2>/dev/null | sed 's/^/[web-scan-dalfox] /' | head -120; fi\nprintf '[web-finding-queue] nuclei_jsonl=/tmp/repi-nuclei.jsonl exists=%s\\n' "$([ -s /tmp/repi-nuclei.jsonl ] && echo true || echo false)"\nSH\nchmod +x /tmp/repi-web-template-scan.sh\n/tmp/repi-web-template-scan.sh ${ctx.urlArg}`
			: "printf '[web-scan-template] target_url_missing=<URL>\\n'",
		"bounded vulnerability template scan producing a candidate finding queue for manual replay",
	);
	ctx.add(
		"web-scan-manual-replay-verifier",
		ctx.targetIsUrl
			? `cat > /tmp/repi-web-verify.py <<'PY'\n#!/usr/bin/env python3\nimport hashlib, json, pathlib, subprocess, sys\nurl=sys.argv[1]\nprint('[web-scan-verifier]', 'base=' + url)\npaths=[]\nfor raw in ['/tmp/repi-web-corpus.txt']:\n    p=pathlib.Path(raw)\n    if p.exists(): paths += [x.strip() for x in p.read_text(errors='ignore').splitlines() if x.strip()][:30]\nif not paths: paths=[url]\nfor item in dict.fromkeys(paths):\n    try:\n        r=subprocess.run(['curl','-k','-sS','-L','--max-time','10','-o','-','-w','\\n%{http_code} %{url_effective}',item], text=False, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=14)\n        body, _, meta=r.stdout.rpartition(b'\\n')\n        print('[web-scan-verifier]', 'url=' + item, 'status_meta=' + meta.decode('utf-8','ignore'), 'body_sha256=' + hashlib.sha256(body).hexdigest(), 'bytes=' + str(len(body)))\n    except Exception as exc:\n        print('[web-scan-verifier]', 'url=' + item, 'error=' + type(exc).__name__ + ':' + str(exc)[:120])\nPY\nchmod +x /tmp/repi-web-verify.py\npython3 /tmp/repi-web-verify.py ${ctx.urlArg}`
			: "printf '[web-scan-verifier] target_url_missing=<URL>\\n'",
		"manual replay verifier for scanner/crawl findings with status, effective URL, body hash, and bytes",
	);
}
