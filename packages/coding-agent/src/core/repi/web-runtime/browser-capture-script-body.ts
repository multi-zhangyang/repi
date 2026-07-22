/** Live browser node capture script body. */
import { liveBrowserPlaywrightFunctionSource } from "./browser-capture-playwright.ts";

export function liveBrowserNodeScript(): string {
	return [
		String.raw`const url = process.argv[2];
const timeout = Number(process.argv[3] || 15000);
const capture = { url: 0, status: 0, cookies: 0, api: 0, sourcemap: 0, scripts: 0, storage: 0, websocket: 0 };
function log(prefix, obj) {
  const parts = Object.entries(obj || {}).map(([k, v]) => String(k) + '=' + String(v).replace(/\s+/g, ' ').slice(0, 300));
  console.log(prefix + ' ' + parts.join(' '));
}
function noteBodySignals(text) {
  const scripts = (text.match(/<script\b/gi) || []).length;
  if (scripts) { capture.scripts = 1; console.log('[browser-script] count=' + scripts); }
  const scriptSrcs = Array.from(text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map((m) => m[1]);
  for (const src of scriptSrcs.slice(0, 20)) console.log('[browser-script] url=' + String(src).slice(0, 300));
  if (/\.map\b|sourceMappingURL/i.test(text)) { capture.sourcemap = 1; console.log('[browser-sourcemap] signal=true'); }
  if (/Set-Cookie|document\.cookie|localStorage|sessionStorage/i.test(text)) capture.cookies = Math.max(capture.cookies, 1);
  if (/\/api\/|graphql|Authorization|Bearer|XMLHttpRequest|fetch\s*\(/i.test(text)) {
    capture.api = 1;
    console.log('[browser-xhr] method=GET url=inline-or-bundle-api-pattern');
  }
  if (/WebSocket|wss?:\/\//i.test(text)) { capture.websocket = 1; console.log('[browser-websocket] url=inline-or-bundle'); }
}
function emitProofCapture(engine) {
  console.log('[browser-url] ' + url);
  console.log('[browser-proof-capture] url=' + capture.url + ' status=' + capture.status + ' cookies=' + capture.cookies + ' api=' + capture.api + ' sourcemap=' + capture.sourcemap + ' scripts=' + capture.scripts + ' storage=' + capture.storage + ' websocket=' + capture.websocket + ' engine=' + engine);
  const strong = capture.url && capture.status && ((capture.cookies || capture.api || capture.storage || capture.websocket) && (capture.sourcemap || capture.scripts || capture.api));
  const partial = capture.url && capture.status;
  const proofExit = strong ? 'runtime_capture_strong' : (partial ? 'partial_runtime_capture' : 'pending_runtime_capture');
  console.log('[browser-proof-capture] proof.exit=' + proofExit + ' bind_ready=' + (proofExit === 'pending_runtime_capture' ? 'false' : 'true') + ' note=engine-' + engine);
  console.log('summary.proof_exit=' + proofExit);
  console.log('summary.capture.url=' + capture.url);
  console.log('summary.capture.status=' + capture.status);
  console.log('summary.capture.cookies=' + capture.cookies);
  console.log('summary.capture.api=' + capture.api);
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
