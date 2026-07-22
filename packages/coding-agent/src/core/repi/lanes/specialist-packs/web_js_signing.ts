/** Specialist pack handlers: web/browser/js. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsJsSigning(ctx: SpecialistPackContext): void {
	ctx.add(
		"js-signing-runtime-repi-bridge",
		ctx.target || ctx.targetIsUrl
			? `printf '%s\n' "re_js_signing run ${ctx.urlArg || ctx.targetArg || "<url-or-bundle>"}" "re_live_browser run ${ctx.urlArg || ctx.targetArg || "<url-or-bundle>"}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[js-signing-runtime-bridge] target_missing\n'",
		"bridge frontend JS signing capture to reverse runtime proof.exit gates",
	);
	ctx.specialists.push("JS signing rebuild");
	ctx.add(
		"js-signing-rebuild-surface",
		'rg -n "fetch\\(|XMLHttpRequest|axios|WebSocket|crypto\\.subtle|subtle\\.|createHmac|createHash|sign|signature|nonce|timestamp|encrypt|decrypt|md5|sha1|sha256|hmac|AES|RSA|webpackJsonp|__webpack_require__" . | head -360',
		"JS request/signature/crypto call sites",
	);
	ctx.add(
		"js-signing-rebuild-sourcemaps",
		"find . -maxdepth 6 -type f \\( -name '*.map' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \\) | sort | head -240",
		"bundle, chunk, and sourcemap inventory",
	);
	ctx.add(
		"js-signing-rebuild-browser-hooks",
		`cat > /tmp/repi-js-runtime-hooks.js <<'JS'\n(() => {\n  const log = (...args) => console.log('[repi-js-hook]', ...args);\n  const safe = value => { try { return JSON.stringify(value).slice(0, 1200); } catch { return String(value); } };\n  if (window.fetch) {\n    const origFetch = window.fetch;\n    window.fetch = async (...args) => { log('fetch.args', safe(args)); const res = await origFetch(...args); log('fetch.response', res.status, res.url); return res; };\n  }\n  const OrigXHR = window.XMLHttpRequest;\n  if (OrigXHR) {\n    window.XMLHttpRequest = function() {\n      const xhr = new OrigXHR();\n      const open = xhr.open;\n      xhr.open = function(method, url, ...rest) { this.__repi_url = url; log('xhr.open', method, url); return open.call(this, method, url, ...rest); };\n      const send = xhr.send;\n      xhr.send = function(body) { log('xhr.send', this.__repi_url, safe(body)); return send.call(this, body); };\n      return xhr;\n    };\n  }\n  if (window.WebSocket) {\n    const OrigWS = window.WebSocket;\n    window.WebSocket = function(url, protocols) { log('ws.open', url); const ws = new OrigWS(url, protocols); const send = ws.send; ws.send = function(data) { log('ws.send', url, safe(data)); return send.call(this, data); }; ws.addEventListener('message', event => log('ws.recv', url, safe(event.data))); return ws; };\n  }\n  if (window.crypto && crypto.subtle) {\n    for (const name of ['digest', 'sign', 'verify', 'encrypt', 'decrypt', 'importKey', 'deriveKey']) {\n      if (!crypto.subtle[name]) continue;\n      const orig = crypto.subtle[name].bind(crypto.subtle);\n      crypto.subtle[name] = async (...args) => { log('crypto.subtle.' + name + '.args', safe(args)); const out = await orig(...args); log('crypto.subtle.' + name + '.ret', out?.byteLength ?? safe(out)); return out; };\n    }\n  }\n})();\nJS\ncat /tmp/repi-js-runtime-hooks.js`,
		"browser hook snippet for fetch/XMLHttpRequest/WebSocket/crypto.subtle arguments and returns",
	);
	ctx.add(
		"js-signing-rebuild-node-scaffold",
		`cat > /tmp/repi-signing-rebuild.mjs <<'NODE'\nimport crypto from 'node:crypto';\nconst observed = JSON.parse(process.env.REPI_OBSERVED ?? '{}');\nconst stableStringify = value => JSON.stringify(value, Object.keys(value ?? {}).sort());\nfunction hmacSha256(secret, message) { return crypto.createHmac('sha256', secret).update(message).digest('hex'); }\nfunction sha256(message) { return crypto.createHash('sha256').update(message).digest('hex'); }\nconsole.log('[repi-signing-rebuild] observed=', stableStringify(observed));\nconsole.log('[repi-signing-rebuild] sha256(body)=', sha256(observed.body ?? ''));\nconsole.log('[repi-signing-rebuild] set REPI_OBSERVED to captured args and patch first divergence here');\nNODE\nnode /tmp/repi-signing-rebuild.mjs`,
		"Node local signing rebuild scaffold and first-divergence patch point",
	);
	ctx.add(
		"js-signing-observation-normalizer",
		`cat > /tmp/repi-js-normalize.mjs <<'NODE'\nimport crypto from 'node:crypto';\nimport { existsSync, readFileSync, writeFileSync } from 'node:fs';\nconst raw = process.env.REPI_JS_LOG ?? (existsSync('/tmp/repi-js-hook.log') ? readFileSync('/tmp/repi-js-hook.log', 'utf8') : JSON.stringify(JSON.parse(process.env.REPI_OBSERVED ?? '{}')));\nconst lines = raw.split(/\\r?\\n/).filter(Boolean);\nconst urls = [...new Set([...raw.matchAll(/https?:\\/\\/[^\\s"')]+|\\/(?:api|graphql|v\\d+)\\/[^\\s"')]+/gi)].map(match => match[0]))];\nconst cryptoOps = [...new Set([...raw.matchAll(/crypto\\.subtle\\.(digest|sign|verify|encrypt|decrypt|importKey|deriveKey)|\\b(HMAC|SHA-?256|SHA-?1|MD5|AES|RSA)\\b/gi)].map(match => match[0]))];\nconst keyFields = [...new Set([...raw.matchAll(/\\b(signature|sign|sig|nonce|timestamp|ts|token|authorization|x-[a-z0-9-]*sign[a-z0-9-]*)\\b/gi)].map(match => match[0]))];\nconst bodyMatches = [...raw.matchAll(/(?:body|data|payload)["':=\\s]+([^\\n]{1,400})/gi)].map(match => match[1]);\nconst bodyHashes = bodyMatches.slice(0, 8).map(value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 24));\nconst normalized = { capturedAt: new Date().toISOString(), lines: lines.slice(0, 200), urls, cryptoOps, keyFields, bodyHashes, rawHead: raw.slice(0, 4000) };\nwriteFileSync('/tmp/repi-js-observed.json', JSON.stringify(normalized, null, 2));\nconsole.log('[js-signing-normalized]', 'artifact=/tmp/repi-js-observed.json', 'events=' + lines.length, 'urls=' + urls.length, 'crypto_ops=' + cryptoOps.join(','), 'key_fields=' + keyFields.join(','), 'body_hashes=' + bodyHashes.join(','));\nNODE\nnode /tmp/repi-js-normalize.mjs`,
		"normalize captured JS hook/network logs into a reusable observed signing artifact",
	);
	ctx.add(
		"js-signing-first-divergence-scaffold",
		`cat > /tmp/repi-js-first-divergence.mjs <<'NODE'\nimport crypto from 'node:crypto';\nimport { existsSync, readFileSync } from 'node:fs';\nconst observed = JSON.parse(process.env.REPI_OBSERVED ?? (existsSync('/tmp/repi-js-observed.json') ? readFileSync('/tmp/repi-js-observed.json', 'utf8') : '{}'));\nconst expected = process.env.REPI_EXPECTED_SIGNATURE ?? observed.signature ?? observed.sign ?? '';\nconst candidate = process.env.REPI_CANDIDATE_SIGNATURE ?? '';\nconst body = String(process.env.REPI_BODY ?? observed.body ?? observed.rawHead ?? '');\nconst secret = process.env.REPI_SECRET ?? '';\nconst stable = value => typeof value === 'string' ? value : JSON.stringify(value, Object.keys(value ?? {}).sort());\nconst sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');\nconst hmac = value => secret ? crypto.createHmac('sha256', secret).update(String(value)).digest('hex') : '';\nconst candidates = [\n  ['body', body],\n  ['stable_observed', stable(observed)],\n  ['urls_joined', (observed.urls ?? []).join('&')],\n  ['key_fields_joined', (observed.keyFields ?? []).join('&')],\n].map(([name, value]) => ({ name, sha256: sha256(value), hmacSha256: hmac(value), bytes: String(value).length }));\nlet best = candidates.find(item => expected && (item.sha256 === expected || item.hmacSha256 === expected));\nif (!best && candidate && expected) best = { name: 'provided_candidate', sha256: candidate, hmacSha256: '', bytes: candidate.length, match: candidate === expected };\nconsole.log('[js-first-divergence]', 'expected=' + (expected || '<unset>'), 'candidate=' + (candidate || '<derived>'), 'match=' + String(Boolean(best && (!expected || best.sha256 === expected || best.hmacSha256 === expected || best.match))), 'suspect=' + (best?.name ?? 'unknown'), 'observed_keys=' + Object.keys(observed).join(','));\nfor (const item of candidates) console.log('[js-first-divergence-candidate]', 'name=' + item.name, 'bytes=' + item.bytes, 'sha256=' + item.sha256.slice(0, 24), 'hmacSha256=' + item.hmacSha256.slice(0, 24));\nNODE\nnode /tmp/repi-js-first-divergence.mjs`,
		"first-divergence scaffold comparing observed signing material against candidate hashes/HMACs",
	);
	ctx.add(
		"js-signing-replay-harness-scaffold",
		`cat > /tmp/repi-js-replay-harness.mjs <<'NODE'\nimport crypto from 'node:crypto';\nconst url = process.env.REPI_REPLAY_URL ?? '';\nconst method = process.env.REPI_METHOD ?? 'GET';\nconst body = process.env.REPI_BODY ?? undefined;\nconst headers = JSON.parse(process.env.REPI_HEADERS ?? '{}');\nif (process.env.REPI_SIGNATURE_KEY && process.env.REPI_SIGNATURE_VALUE) headers[process.env.REPI_SIGNATURE_KEY] = process.env.REPI_SIGNATURE_VALUE;\nif (!url) {\n  console.log('[js-replay-harness]', 'ready=true', 'set=REPI_REPLAY_URL,REPI_METHOD,REPI_HEADERS,REPI_SIGNATURE_KEY,REPI_SIGNATURE_VALUE');\n  process.exit(0);\n}\nconst response = await fetch(url, { method, headers, body: /^(GET|HEAD)$/i.test(method) ? undefined : body, redirect: 'manual' });\nconst data = Buffer.from(await response.arrayBuffer());\nconst hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 24);\nconsole.log('[js-replay-harness]', 'url=' + url, 'method=' + method, 'status=' + response.status, 'bytes=' + data.length, 'body_hash=' + hash, 'signature_key=' + (process.env.REPI_SIGNATURE_KEY ?? '<none>'));\nNODE\nnode /tmp/repi-js-replay-harness.mjs`,
		"signed request replay harness for validating rebuilt JS signature against live response drift",
	);
}
