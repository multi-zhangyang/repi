/** Live browser node capture script body. */
import { liveBrowserPlaywrightFunctionSource } from "./browser-capture-playwright.ts";

export function liveBrowserNodeScript(): string {
	return [
		String.raw`const url = process.argv[2];
const timeout = Number(process.argv[3] || 15000);
const capture = { url: 0, status: 0, cookies: 0, api: 0, organic_api: 0, challenge: 0, sourcemap: 0, scripts: 0, storage: 0, websocket: 0 };
function log(prefix, obj) {
  const parts = Object.entries(obj || {}).map(([k, v]) => String(k) + '=' + String(v).replace(/\s+/g, ' ').slice(0, 300));
  console.log(prefix + ' ' + parts.join(' '));
}
function isChallengeUrl(u) {
  return /captcha|verifycenter|verify\.|\/vc\/|challenge|geetest|recaptcha|hcaptcha|turnstile|anti[_-]?bot|滑块|验证码/i.test(String(u || ''));
}
function isOrganicApiUrl(u) {
  const s = String(u || '');
  if (isChallengeUrl(s)) return false;
  return /\/api\/|graphql|\.json(\?|$)|\/aweme\/|\/web\/|\/bff\/|\/gateway\//i.test(s);
}
function noteBodySignals(text) {
  const scripts = (text.match(/<script\b/gi) || []).length;
  if (scripts) { capture.scripts = 1; console.log('[browser-script] count=' + scripts); }
  const scriptSrcs = Array.from(text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map((m) => m[1]);
  for (const src of scriptSrcs.slice(0, 20)) {
    console.log('[browser-script] url=' + String(src).slice(0, 300));
    if (isChallengeUrl(src)) capture.challenge = 1;
  }
  if (/\.map\b|sourceMappingURL/i.test(text)) { capture.sourcemap = 1; console.log('[browser-sourcemap] signal=true'); }
  if (/Set-Cookie|document\.cookie|localStorage|sessionStorage/i.test(text)) capture.cookies = Math.max(capture.cookies, 1);
  if (/captcha|verifycenter|验证码|challenge|geetest|recaptcha|hcaptcha|turnstile|anti[_-]?bot/i.test(text)) {
    capture.challenge = 1;
    console.log('[browser-challenge] signal=body');
  }
  if (/\/api\/|graphql|Authorization|Bearer|XMLHttpRequest|fetch\s*\(/i.test(text)) {
    capture.api = 1;
    console.log('[browser-xhr] method=GET url=inline-or-bundle-api-pattern');
    if (!isChallengeUrl(text.slice(0, 4000))) capture.organic_api = Math.max(capture.organic_api, 0);
  }
  if (/WebSocket|wss?:\/\//i.test(text)) { capture.websocket = 1; console.log('[browser-websocket] url=inline-or-bundle'); }
}
function emitProofCapture(engine) {
  console.log('[browser-url] ' + url);
  console.log('[browser-proof-capture] url=' + capture.url + ' status=' + capture.status + ' cookies=' + capture.cookies + ' api=' + capture.api + ' organic_api=' + capture.organic_api + ' challenge=' + capture.challenge + ' sourcemap=' + capture.sourcemap + ' scripts=' + capture.scripts + ' storage=' + capture.storage + ' websocket=' + capture.websocket + ' engine=' + engine);
  // Strong = runtime surface beyond challenge/interstitial walls (general, not site-specific).
  const rich = (capture.cookies || capture.api || capture.storage || capture.websocket) && (capture.sourcemap || capture.scripts || capture.api || capture.organic_api);
  let strong = capture.url && capture.status && rich;
  if (capture.challenge && !capture.organic_api && !capture.sourcemap) {
    // Challenge/captcha interstitial with only challenge XHR/scripts is partial, not business-strong.
    strong = false;
  }
  const partial = capture.url && capture.status;
  const proofExit = strong ? 'runtime_capture_strong' : (partial ? 'partial_runtime_capture' : 'pending_runtime_capture');
  const note = capture.challenge && !capture.organic_api ? 'challenge_surface_only' : ('engine-' + engine);
  console.log('[browser-proof-capture] proof.exit=' + proofExit + ' bind_ready=' + (proofExit === 'pending_runtime_capture' ? 'false' : 'true') + ' note=' + note);
  console.log('summary.proof_exit=' + proofExit);
  console.log('summary.challenge_interstitial=' + (capture.challenge ? 'true' : 'false'));
  console.log('summary.organic_api=' + (capture.organic_api ? 'true' : 'false'));
  if (capture.challenge && !capture.organic_api) console.log('summary.proof_honesty=challenge_surface_not_business_depth');
  console.log('summary.capture.url=' + capture.url);
  console.log('summary.capture.status=' + capture.status);
  console.log('summary.capture.cookies=' + capture.cookies);
  console.log('summary.capture.api=' + capture.api);
  console.log('summary.capture.organic_api=' + capture.organic_api);
  console.log('summary.capture.challenge=' + capture.challenge);
  console.log('summary.capture.sourcemap=' + capture.sourcemap);
  console.log('summary.capture.scripts=' + capture.scripts);
}
async function plainFetch() {
  const started = Date.now();
  const response = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'REPI live-browser fallback' } });
  const text = await response.text();
  capture.url = 1;
  capture.status = 1;
  const setCookie = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const cookieHeader = response.headers.get('set-cookie') || '';
  if ((setCookie && setCookie.length) || cookieHeader) {
    capture.cookies = 1;
    console.log('[browser-cookie] count=' + Math.max(setCookie.length, cookieHeader ? 1 : 0) + ' head=' + String(cookieHeader || setCookie[0] || '').slice(0, 180));
  }
  log('[browser-request]', { method: 'GET', url, resource: 'document', engine: 'fetch' });
  log('[browser-response]', { status: response.status, url: response.url || url, content_type: response.headers.get('content-type') || '', elapsed_ms: Date.now() - started, bytes: text.length });
  console.log('[browser-status] ' + response.status);
  console.log('[browser-body-head] ' + text.slice(0, 1200).replace(/\s+/g, ' '));
  noteBodySignals(text);
  emitProofCapture('fetch');
}`,
		liveBrowserPlaywrightFunctionSource(),
		String.raw`(async () => {
  if (!url || !/^https?:\/\//i.test(url)) {
    console.log('[browser-error] missing-or-invalid-url url=' + String(url || ''));
    process.exitCode = 2;
    return;
  }
  try {
    const usedPlaywright = await playwrightCapture();
    if (!usedPlaywright) await plainFetch();
  } catch (error) {
    console.log('[browser-error] ' + (error && error.stack ? error.stack : String(error)).replace(/\s+/g, ' ').slice(0, 2000));
    try { await plainFetch(); } catch (fallbackError) {
      console.log('[browser-error] fallback-failed ' + String(fallbackError).replace(/\s+/g, ' ').slice(0, 500));
      process.exitCode = 1;
    }
  }
})();`,
	].join("\n");
}
