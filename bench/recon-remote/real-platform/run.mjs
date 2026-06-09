#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const selfTestOnly = process.argv.includes('--self-test') || process.env.RECON_SELF_TEST === '1';
const target = selfTestOnly ? 'https://example.invalid/' : (process.env.RECON_TARGET_URL || process.argv[2]);
const profileArg = String(process.env.RECON_PROFILE || process.argv[3] || 'auto').toLowerCase();
const probeLimit = Number(process.env.RECON_PROBE_LIMIT || 16);
const timeoutMs = Number(process.env.RECON_TIMEOUT_MS || 35000);
const quietMs = Number(process.env.RECON_QUIET_MS || 2500);
const maxBodyBytes = Number(process.env.RECON_MAX_BODY_BYTES || 500000);
const browserMode = String(process.env.RECON_BROWSER || 'auto').toLowerCase();
const chromeBin = process.env.RECON_CHROME_BIN || process.env.CHROME_BIN || '';
const userAgent = process.env.RECON_USER_AGENT || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36 Pi-RECON-real-platform';

if (!selfTestOnly && (!target || target === '--help' || target === '-h')) {
  console.log(`Pi-RECON real platform hard benchmark\n\nUsage:\n  node bench/recon-remote/real-platform/run.mjs <url> [auto|bilibili-video|xiaohongshu-note|generic-cdp]\n  node bench/recon-remote/real-platform/run.mjs --self-test\n\nExamples:\n  node bench/recon-remote/real-platform/run.mjs https://www.bilibili.com/video/BV1odL76QE6B bilibili-video\n  node bench/recon-remote/real-platform/run.mjs 'https://www.xiaohongshu.com/explore/66237c6e000000001c00893f' xiaohongshu-note\n\nEnvironment:\n  RECON_BROWSER=auto|1|0\n  RECON_PROBE_LIMIT=16\n  RECON_TIMEOUT_MS=35000\n  RECON_QUIET_MS=2500\n  RECON_MAX_BODY_BYTES=500000\n  RECON_CHROME_BIN=<path>\n\nOutput:\n  .pi/evidence/remote/real-platform/<profile>/<host>/<timestamp>/\n`);
  process.exit(target ? 0 : 2);
}

function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function md5(value) { return createHash('md5').update(value).digest('hex'); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function slug(value) { return String(value || 'x').replace(/[^a-zA-Z0-9_.-]+/g, '_').slice(0, 120) || 'x'; }
function unique(items) { return [...new Set(items.filter(Boolean))]; }
function safeJsonParse(text, fallback = null) { try { return JSON.parse(text); } catch { return fallback; } }

function assertHttpUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  return url;
}

function detectProfile(url) {
  if (profileArg !== 'auto') return profileArg;
  const host = url.hostname.toLowerCase();
  if (host.includes('bilibili.com') || host.includes('b23.tv')) return 'bilibili-video';
  if (host.includes('xiaohongshu.com') || host.includes('xhslink.com')) return 'xiaohongshu-note';
  return 'generic-cdp';
}

function requestHeaders(extra = {}) {
  return {
    'user-agent': userAgent,
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    ...extra,
  };
}

function sanitizeHeaders(headers = {}) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (/cookie|authorization|token|session|csrf|xsrf|buvid|sid|a1|^x-s$|^x-t$|^x-s-common$|^x-b3-traceid$|^x-xray-traceid$/i.test(key)) out[key] = '<redacted>';
    else out[key] = value;
  }
  return out;
}

function redactUrl(value) {
  try {
    const url = new URL(String(value || ''));
    for (const key of [...url.searchParams.keys()]) {
      if (/token|w_rid|wts|buvid|sid|sess|csrf|a1|xsec|web_session|msToken|a_bogus|hmac|upsig|trid|oi|mid|hdnts|deadline|uparams|qn_dyeid/i.test(key)) url.searchParams.set(key, '<redacted>');
    }
    return url.toString();
  } catch {
    return String(value || '').replace(/(token|w_rid|buvid|xsec_token|msToken|a_bogus)=([^&\s]+)/gi, '$1=<redacted>');
  }
}

function redactText(value) {
  return String(value || '')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '<redacted.jwt>')
    .replace(/((?:authorization|cookie|token|session|csrf|xsrf|xsec_token|web_session|msToken|a_bogus|w_rid|upsig|trid|hdnts|deadline|a1|b1|x-s-common|x-s|x-t)[\"']?\s*[:=]\s*[\"']?)([^\"'&\s<>\\]+)/gi, '$1<redacted>')
    .replace(/((?:token|xsec_token|web_session|msToken|a_bogus|w_rid|upsig|trid|hdnts|deadline|a1|b1)=)([^&\s<>\"']+)/gi, '$1<redacted>');
}

async function fetchText(url, options = {}) {
  const res = await fetch(url, { redirect: options.redirect || 'manual', headers: requestHeaders(options.headers || {}) });
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    url,
    status: res.status,
    headers: sanitizeHeaders(Object.fromEntries(res.headers.entries())),
    bytes: buffer.length,
    sha256: sha256(buffer).slice(0, 24),
    text: buffer.subarray(0, maxBodyBytes).toString('utf8'),
  };
}

async function fetchJson(url, options = {}) {
  const item = await fetchText(url, { ...options, headers: { accept: 'application/json,text/plain,*/*', ...(options.headers || {}) } });
  return { ...item, json: safeJsonParse(item.text) };
}

async function probeUrl(url, headers = {}) {
  const attempts = [];
  let current = url;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(current, { method: 'HEAD', redirect: 'manual', headers: requestHeaders(headers) });
      const h = sanitizeHeaders(Object.fromEntries(res.headers.entries()));
      attempts.push({ method: 'HEAD', url: redactUrl(current), status: res.status, headers: h });
      if ([301, 302, 303, 307, 308].includes(res.status) && res.headers.get('location')) {
        current = new URL(res.headers.get('location'), current).toString();
        continue;
      }
      if (![200, 206].includes(res.status)) {
        const gr = await fetch(current, { method: 'GET', redirect: 'manual', headers: requestHeaders({ ...headers, range: 'bytes=0-0' }) });
        const buf = Buffer.from(await gr.arrayBuffer());
        attempts.push({ method: 'GET bytes=0-0', url: redactUrl(current), status: gr.status, headers: sanitizeHeaders(Object.fromEntries(gr.headers.entries())), bytes: buf.length, sha256: sha256(buf).slice(0, 24) });
      }
      break;
    } catch (error) {
      attempts.push({ method: 'probe', url: redactUrl(current), status: 'error', error: error instanceof Error ? error.message : String(error) });
      break;
    }
  }
  const hay = attempts.map((a) => `${a.url} ${a.headers?.['content-type'] || ''} ${a.headers?.location || ''}`).join(' ').toLowerCase();
  const media = /video|audio|mp4|m4s|mpegurl|octet-stream|\.m4s|\.mp4|\.m3u8/.test(hay);
  const reachable = attempts.some((a) => [200, 206, 301, 302, 303, 307, 308].includes(Number(a.status)));
  return { originalUrl: redactUrl(url), attempts, classification: { media, reachable } };
}

function extractBvid(text) {
  return String(text || '').match(/BV[0-9A-Za-z]{10}/)?.[0] || '';
}

function collectBiliMedia(playJson) {
  const data = playJson?.data || playJson?.result || {};
  const out = [];
  for (const durl of data.durl || []) {
    out.push({ kind: 'durl', quality: data.quality, url: durl.url, size: durl.size, length: durl.length });
    for (const backup of durl.backup_url || durl.backupUrl || []) out.push({ kind: 'durl-backup', quality: data.quality, url: backup });
  }
  for (const item of data.dash?.video || []) {
    out.push({ kind: 'dash-video', id: item.id, codecs: item.codecs, bandwidth: item.bandwidth, url: item.baseUrl || item.base_url });
    for (const backup of item.backupUrl || item.backup_url || []) out.push({ kind: 'dash-video-backup', id: item.id, codecs: item.codecs, url: backup });
  }
  for (const item of data.dash?.audio || []) {
    out.push({ kind: 'dash-audio', id: item.id, codecs: item.codecs, bandwidth: item.bandwidth, url: item.baseUrl || item.base_url });
    for (const backup of item.backupUrl || item.backup_url || []) out.push({ kind: 'dash-audio-backup', id: item.id, codecs: item.codecs, url: backup });
  }
  return out.filter((x) => x.url);
}


const biliMixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

function biliWbiKeys(navJson) {
  const imgUrl = navJson?.data?.wbi_img?.img_url || '';
  const subUrl = navJson?.data?.wbi_img?.sub_url || '';
  const imgKey = imgUrl.split('/').pop()?.split('.')[0] || '';
  const subKey = subUrl.split('/').pop()?.split('.')[0] || '';
  const raw = imgKey + subKey;
  const mixinKey = biliMixinKeyEncTab.map((index) => raw[index] || '').join('').slice(0, 32);
  return { imgKey, subKey, mixinKey };
}

function signBiliWbi(params, mixinKey, wts = Math.floor(Date.now() / 1000)) {
  const filtered = { ...params, wts };
  const normalized = {};
  for (const key of Object.keys(filtered).sort()) normalized[key] = String(filtered[key]).replace(/[!'()*]/g, '');
  const query = new URLSearchParams(normalized).toString();
  const wRid = md5(query + mixinKey);
  return { query: `${query}&w_rid=${wRid}`, wRid, wts };
}

function biliWbiSelfTest() {
  const raw = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  const mixinKey = biliMixinKeyEncTab.map((index) => raw[index] || '').join('').slice(0, 32);
  const signed = signBiliWbi({ bvid: 'BV1xx411c7mD', cid: 123456, qn: 80, fnval: 4048, fourk: 1 }, mixinKey, 1700000000);
  const cases = [
    { name: 'mixin-key-table', ok: mixinKey === 'UVsc1ixGpYkF6dTJBRfXHjQtDCoNmMPn', actualSha256: sha256(mixinKey).slice(0, 16) },
    { name: 'wbi-normalize-and-md5', ok: signed.wRid === 'dd3a8198427ac661d88d3280c8f8355d', actualSha256: sha256(signed.wRid).slice(0, 16) },
    { name: 'query-order', ok: signed.query.startsWith('bvid=BV1xx411c7mD&cid=123456&fnval=4048&fourk=1&qn=80&wts=1700000000&'), actualSha256: sha256(signed.query).slice(0, 16) },
  ];
  return { ok: cases.every((item) => item.ok), cases };
}

function summarizeMediaProbeMatrix(probes = []) {
  const byKind = {};
  const byStatus = {};
  const hostClasses = {};
  let reachableMedia = 0;
  let range206 = 0;
  for (const probe of probes || []) {
    byKind[probe.kind || 'unknown'] = (byKind[probe.kind || 'unknown'] || 0) + 1;
    if (probe.probe?.classification?.media && probe.probe?.classification?.reachable) reachableMedia += 1;
    for (const attempt of probe.probe?.attempts || []) {
      byStatus[String(attempt.status)] = (byStatus[String(attempt.status)] || 0) + 1;
      if (Number(attempt.status) === 206 || /bytes/i.test(attempt.headers?.['content-range'] || '')) range206 += 1;
    }
    try {
      const host = new URL(probe.probe?.originalUrl || probe.url || '').hostname;
      const key = host.includes('bilivideo') ? 'bilivideo' : host.split('.').slice(-2).join('.') || 'unknown';
      hostClasses[key] = (hostClasses[key] || 0) + 1;
    } catch {}
  }
  return { total: probes.length, reachableMedia, range206, byKind, byStatus, hostClasses };
}

async function runBilibili(url, outDir) {
  const page = await fetchText(url.toString(), { headers: { referer: 'https://www.bilibili.com/' } });
  let finalUrl = url.toString();
  if ([301, 302, 303, 307, 308].includes(page.status) && page.headers.location) {
    finalUrl = new URL(page.headers.location, url).toString();
  }
  const bvid = extractBvid(finalUrl) || extractBvid(page.text);
  if (!bvid) return { verdict: 'missing-bvid', page };
  const referer = `https://www.bilibili.com/video/${bvid}/`;
  const nav = await fetchJson('https://api.bilibili.com/x/web-interface/nav', { headers: { referer: 'https://www.bilibili.com/' } });
  const wbiKeys = biliWbiKeys(nav.json);
  const view = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`, { headers: { referer } });
  const pagelist = await fetchJson(`https://api.bilibili.com/x/player/pagelist?bvid=${encodeURIComponent(bvid)}`, { headers: { referer } });
  const cid = view.json?.data?.cid || pagelist.json?.data?.[0]?.cid;
  const playurls = [];
  let wbiPlayurl = null;
  if (cid) {
    for (const fnval of [4048, 80, 16, 0]) {
      const api = `https://api.bilibili.com/x/player/playurl?bvid=${encodeURIComponent(bvid)}&cid=${encodeURIComponent(cid)}&qn=80&fnval=${fnval}&fourk=1`;
      playurls.push({ fnval, signed: false, ...(await fetchJson(api, { headers: { referer } })) });
    }
    if (wbiKeys.mixinKey) {
      const signed = signBiliWbi({ bvid, cid, qn: 80, fnval: 4048, fourk: 1 }, wbiKeys.mixinKey);
      const api = `https://api.bilibili.com/x/player/wbi/playurl?${signed.query}`;
      wbiPlayurl = { fnval: 4048, signed: true, api, wts: signed.wts, wRidSha256: sha256(signed.wRid).slice(0, 16), ...(await fetchJson(api, { headers: { referer } })) };
      playurls.push(wbiPlayurl);
    }
  }
  const media = unique(playurls.flatMap((p) => collectBiliMedia(p.json).map((m) => JSON.stringify({ ...m, source: p.signed ? 'wbi-playurl' : 'playurl', fnval: p.fnval })))).map((x) => JSON.parse(x));
  const probes = [];
  for (const item of media.slice(0, probeLimit)) probes.push({ ...item, url: redactUrl(item.url), probe: await probeUrl(item.url, { referer, origin: 'https://www.bilibili.com' }) });
  const strong = probes.filter((p) => p.probe.classification.media && p.probe.classification.reachable);
  const wbiOk = wbiPlayurl?.json?.code === 0;
  const verdict = view.json?.code === 0 && wbiOk && strong.length ? 'bilibili-wbi-media-api-confirmed' : view.json?.code === 0 && playurls.some((p) => p.json?.code === 0) && strong.length ? 'bilibili-media-api-confirmed' : media.length ? 'bilibili-media-candidates-needs-replay' : 'bilibili-no-media-candidate';
  const selfTest = biliWbiSelfTest();
  let browserArtifact = null;
  let browser = null;
  let signatureTrace = { platform: 'bili', observedHeaderNames: [], signedRequestCount: 0, signedRequests: [], apiTimeline: [], bundleHints: [], storageKeyHints: [], signerLog: [], signerKinds: {} };
  if (['1', 'true', 'on'].includes(browserMode) || process.env.RECON_BILI_CDP === '1') {
    const runtimeProbes = [];
    if (wbiPlayurl?.api) {
      const apiForRuntime = wbiPlayurl.api;
      runtimeProbes.push(`(() => { const u = ${JSON.stringify(apiForRuntime)}; window.__PI_RECON_SIGNER_LOG__ = window.__PI_RECON_SIGNER_LOG__ || []; window.__PI_RECON_SIGNER_LOG__.push({kind:'bili-runtime-wbi-probe', at:Date.now(), url:u.replace(/([?&](?:w_rid|wts)=)[^&]+/g,'$1<redacted>')}); fetch(u, { credentials:'include', mode:'no-cors' }).catch(() => {}); return true; })()`);
    }
    const cdp = await captureCdp(new URL(referer), outDir, { runtimeProbes, probeWaitMs: 6000 });
    signatureTrace = analyzeSignatureTrace(cdp, 'bili');
    const externalBundleHints = await collectExternalBundleHints(cdp, 'bili');
    if (externalBundleHints.length) {
      const seenBundles = new Set(signatureTrace.bundleHints.map((hint) => `${hint.url}:${hint.sha256}`));
      for (const hint of externalBundleHints) {
        const key = `${hint.url}:${hint.sha256}`;
        if (!seenBundles.has(key)) { signatureTrace.bundleHints.push(hint); seenBundles.add(key); }
      }
    }
    const safeCdp = stripRuntimeSecrets(cdp);
    await writeFile(join(outDir, 'browser.json'), `${JSON.stringify(safeCdp, null, 2)}\n`);
    if (safeCdp.storage?.html) await writeFile(join(outDir, 'browser.html'), safeCdp.storage.html);
    browserArtifact = join(outDir, 'browser.json');
    browser = { requests: cdp.requests.length, responses: cdp.responses.length, bodies: cdp.bodies.length, failures: cdp.failures.length, errors: cdp.errors, skipped: Boolean(cdp.skipped), skipReason: cdp.skipReason };
  }
  return {
    verdict,
    bvid,
    aid: view.json?.data?.aid,
    cid,
    title: view.json?.data?.title,
    owner: view.json?.data?.owner ? { mid: '<redacted>', name: view.json.data.owner.name } : undefined,
    page: { status: page.status, bytes: page.bytes, sha256: page.sha256, finalUrl: redactUrl(finalUrl) },
    nav: { status: nav.status, code: nav.json?.code, hasWbiImg: Boolean(wbiKeys.imgKey && wbiKeys.subKey), imgKey: wbiKeys.imgKey ? '<derived>' : '', subKey: wbiKeys.subKey ? '<derived>' : '', mixinKeySha256: wbiKeys.mixinKey ? sha256(wbiKeys.mixinKey).slice(0, 16) : '' },
    view: { status: view.status, code: view.json?.code, bytes: view.bytes },
    pagelist: { status: pagelist.status, code: pagelist.json?.code, pages: pagelist.json?.data?.length || 0 },
    playurls: playurls.map((p) => ({ fnval: p.fnval, signed: Boolean(p.signed), status: p.status, code: p.json?.code, quality: p.json?.data?.quality, accept_quality: p.json?.data?.accept_quality, accept_description: p.json?.data?.accept_description, hasDash: Boolean(p.json?.data?.dash), durlCount: p.json?.data?.durl?.length || 0, wts: p.wts, wRidSha256: p.wRidSha256 })),
    mediaCandidates: media.slice(0, 80).map((m) => ({ ...m, url: redactUrl(m.url) })),
    probes,
    mediaProbeMatrix: summarizeMediaProbeMatrix(probes),
    wbiRegression: { selfTest, signedEndpoint: Boolean(wbiPlayurl), signedParamNames: wbiPlayurl ? ['bvid', 'cid', 'fnval', 'fourk', 'qn', 'wts', 'w_rid'] : [] },
    browser,
    signatureTrace,
    browserArtifact,
    nextActions: ['bind unsigned+WBI playurl API and media HEAD/range probes into re_replayer', 'diff fnval=4048/80/16/0 media capability', 'rerun with RECON_BROWSER=1 to capture browser WBI/buvid runtime drift if browser is absent', 'monitor nav wbi_img/mixin-key drift and w_rid rebuild'],
  };
}

async function which(command) {
  for (const dir of (process.env.PATH || '').split(':')) {
    const full = join(dir, command);
    if (existsSync(full)) return full;
  }
  return '';
}

async function resolveChrome() {
  if (chromeBin) return chromeBin;
  for (const name of ['google-chrome', 'chromium', 'chromium-browser']) {
    const found = await which(name);
    if (found) return found;
  }
  return '';
}

async function waitForDevToolsPort(profileDir, deadlineMs) {
  const file = join(profileDir, 'DevToolsActivePort');
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const text = await readFile(file, 'utf8');
      const [port] = text.trim().split(/\s+/);
      if (port) return Number(port);
    } catch {}
    await sleep(100);
  }
  throw new Error('DevToolsActivePort timeout');
}

async function cdpHttp(port, path, init = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`CDP HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function cdpClient(wsUrl, artifact) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  let closing = false;
  const pending = new Map();
  const open = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), 10000);
    ws.onopen = () => { clearTimeout(timer); resolve(); };
  });
  ws.onerror = (event) => { if (!closing) artifact.errors.push({ type: 'websocket', message: String(event?.message || 'cdp websocket error') }); };
  ws.onmessage = (event) => {
    const msg = safeJsonParse(String(event.data));
    if (!msg) return;
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) item.reject(new Error(JSON.stringify(msg.error)));
      else item.resolve(msg.result || {});
      return;
    }
    const p = msg.params || {};
    if (msg.method === 'Network.requestWillBeSent') artifact.requests.push({ id: p.requestId, type: p.type, method: p.request?.method, url: redactUrl(p.request?.url), rawUrl: p.request?.url, headers: sanitizeHeaders(p.request?.headers || {}), replayHeaders: p.request?.headers || {}, initiator: p.initiator?.type });
    if (msg.method === 'Network.responseReceived') artifact.responses.push({ id: p.requestId, type: p.type, url: redactUrl(p.response?.url), status: p.response?.status, mimeType: p.response?.mimeType, headers: sanitizeHeaders(p.response?.headers || {}) });
    if (msg.method === 'Network.loadingFailed') artifact.failures.push({ id: p.requestId, type: p.type, errorText: p.errorText });
  };
  async function send(method, params = {}) {
    await open;
    const requestId = ++id;
    ws.send(JSON.stringify({ id: requestId, method, params }));
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP command timeout ${method}`)); }, 12000);
      pending.set(requestId, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
    });
  }
  async function close() { closing = true; try { ws.close(); } catch {} }
  return { open, send, close };
}

function runtimeHookSource() {
  return `(() => {
    window.__PI_RECON_FETCH_LOG__ = [];
    window.__PI_RECON_SIGNER_LOG__ = [];
    const sigRe = /w_rid|wts|buvid|x-s-common|x-s|x-t|xsec_token|web_session|a1|b1|captcha|verify|a_bogus|msToken|webid|X-Bogus|_signature|token|sign/i;
    const clean = (value) => String(value || '')
      .replace(/([?&](?:w_rid|wts|buvid|xsec_token|web_session|a1|b1|msToken|a_bogus|webid|web_id|device_id|_signature|X-Bogus|token|sign)=)[^&\\s"']+/ig, '$1<redacted>')
      .slice(0, 900);
    const stack = () => { try { return String(new Error().stack || '').split('\\n').slice(2, 8).join('\\n'); } catch { return ''; } };
    const logSigner = (kind, data = {}) => {
      try {
        const blob = JSON.stringify(data);
        if (!sigRe.test(blob) && !/cookie|headers|urlsearchparams|localstorage|crypto/i.test(kind)) return;
        if (window.__PI_RECON_SIGNER_LOG__.length < 600) window.__PI_RECON_SIGNER_LOG__.push({ kind, at: Date.now(), ...data, stack: clean(stack()) });
      } catch {}
    };
    const oldFetch = window.fetch;
    window.fetch = function(input, init) {
      try {
        const url = String(input && input.url || input);
        window.__PI_RECON_FETCH_LOG__.push({ kind: 'fetch', url: clean(url), method: init && init.method || 'GET', at: Date.now() });
        if (sigRe.test(url) || sigRe.test(JSON.stringify(init && init.headers || {}))) logSigner('fetch', { url: clean(url), method: init && init.method || 'GET' });
      } catch {}
      return oldFetch.apply(this, arguments);
    };
    const oldOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      try {
        this.__PI_RECON_XHR_URL__ = String(url);
        window.__PI_RECON_FETCH_LOG__.push({ kind: 'xhr', method, url: clean(url), at: Date.now() });
        if (sigRe.test(String(url))) logSigner('xhr-open', { method, url: clean(url) });
      } catch {}
      return oldOpen.apply(this, arguments);
    };
    const oldSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      try { if (sigRe.test(String(name)) || sigRe.test(String(value))) logSigner('xhr-header', { url: clean(this.__PI_RECON_XHR_URL__), name: String(name) }); } catch {}
      return oldSetRequestHeader.apply(this, arguments);
    };
    for (const method of ['set', 'append']) {
      const old = URLSearchParams.prototype[method];
      URLSearchParams.prototype[method] = function(key, value) {
        try { if (sigRe.test(String(key)) || sigRe.test(String(value))) logSigner('urlsearchparams-' + method, { key: String(key), valueLength: String(value || '').length }); } catch {}
        return old.apply(this, arguments);
      };
    }
    if (window.Headers) {
      for (const method of ['set', 'append']) {
        const old = Headers.prototype[method];
        Headers.prototype[method] = function(key, value) {
          try { if (sigRe.test(String(key)) || sigRe.test(String(value))) logSigner('headers-' + method, { key: String(key), valueLength: String(value || '').length }); } catch {}
          return old.apply(this, arguments);
        };
      }
    }
    try {
      const oldSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        try { if (sigRe.test(String(key)) || sigRe.test(String(value))) logSigner('localstorage-set', { key: String(key), valueLength: String(value || '').length }); } catch {}
        return oldSetItem.apply(this, arguments);
      };
    } catch {}
    try {
      const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
      if (desc && desc.set && desc.get) Object.defineProperty(document, 'cookie', {
        configurable: true,
        get() { return desc.get.call(document); },
        set(value) {
          try { if (sigRe.test(String(value))) logSigner('cookie-set', { name: String(value).split('=')[0] || '', valueLength: String(value || '').length }); } catch {}
          return desc.set.call(document, value);
        },
      });
    } catch {}
    try {
      const oldDigest = crypto && crypto.subtle && crypto.subtle.digest;
      if (oldDigest) crypto.subtle.digest = function(algorithm, data) {
        try { logSigner('crypto-digest', { algorithm: String(algorithm), bytes: data && (data.byteLength || data.length) || 0 }); } catch {}
        return oldDigest.apply(this, arguments);
      };
    } catch {}
  })();`;
}

async function captureCdp(url, outDir, options = {}) {
  const chrome = await resolveChrome();
  const artifact = { mode: 'chrome-cdp', chrome: chrome || 'missing', target: url.toString(), capturedAt: new Date().toISOString(), requests: [], responses: [], failures: [], bodies: [], storage: {}, errors: [], skipped: false };
  if (!chrome || ['0', 'off', 'false'].includes(browserMode)) { artifact.skipped = true; artifact.skipReason = chrome ? 'browser disabled' : 'chrome missing'; return artifact; }
  const profileDir = join(outDir, `chrome-profile-${randomUUID()}`);
  await mkdir(profileDir, { recursive: true });
  const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check', '--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += String(chunk).slice(0, 2000); });
  try {
    const port = await waitForDevToolsPort(profileDir, 10000);
    const target = (await cdpHttp(port, `/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }));
    const client = cdpClient(target.webSocketDebuggerUrl, artifact);
    await client.open;
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable', { maxTotalBufferSize: 50000000, maxResourceBufferSize: 5000000 });
    await client.send('Network.setUserAgentOverride', { userAgent });
    await client.send('Page.addScriptToEvaluateOnNewDocument', { source: runtimeHookSource() });
    await client.send('Page.navigate', { url: url.toString() });
    let lastCount = -1;
    let lastChange = Date.now();
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const count = artifact.requests.length + artifact.responses.length + artifact.failures.length;
      if (count !== lastCount) { lastCount = count; lastChange = Date.now(); }
      if (Date.now() - lastChange > quietMs && artifact.responses.length) break;
      await sleep(250);
    }
    for (const expression of options.runtimeProbes || []) {
      try {
        await client.send('Runtime.evaluate', { returnByValue: true, awaitPromise: false, expression });
      } catch (error) {
        artifact.errors.push({ type: 'runtime-probe', message: error instanceof Error ? error.message : String(error) });
      }
    }
    if ((options.runtimeProbes || []).length) {
      lastCount = -1;
      lastChange = Date.now();
      const probeDeadline = Date.now() + Number(options.probeWaitMs || 5000);
      while (Date.now() < probeDeadline) {
        const count = artifact.requests.length + artifact.responses.length + artifact.failures.length;
        if (count !== lastCount) { lastCount = count; lastChange = Date.now(); }
        if (Date.now() - lastChange > 1000) break;
        await sleep(250);
      }
    }
    for (const response of artifact.responses.filter((r) => /json|text|html|javascript/i.test(r.mimeType || '')).slice(-80)) {
      try {
        const body = await client.send('Network.getResponseBody', { requestId: response.id });
        const text = body.base64Encoded ? Buffer.from(body.body || '', 'base64').toString('utf8') : String(body.body || '');
        artifact.bodies.push({ id: response.id, url: response.url, mimeType: response.mimeType, length: text.length, sha256: sha256(text).slice(0, 24), text: text.slice(0, maxBodyBytes) });
      } catch (error) { artifact.bodies.push({ id: response.id, url: response.url, error: error instanceof Error ? error.message : String(error) }); }
    }
    const evalResult = await client.send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: `JSON.stringify({href:location.href,title:document.title,html:document.documentElement.outerHTML.slice(0, ${maxBodyBytes}),localStorage:{...localStorage},sessionStorage:{...sessionStorage},cookies:document.cookie,piReconFetchLog:window.__PI_RECON_FETCH_LOG__||[],piReconSignerLog:window.__PI_RECON_SIGNER_LOG__||[]})` });
    artifact.storage = safeJsonParse(evalResult.result?.value || '{}', {});
    artifact.storage.cookies = artifact.storage.cookies ? '<redacted>' : '';
    await client.close();
  } catch (error) {
    artifact.errors.push({ type: 'capture', message: error instanceof Error ? error.stack || error.message : String(error) });
  } finally {
    artifact.stderrHead = stderr.slice(0, 2000);
    try { child.kill('SIGTERM'); } catch {}
    setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 1500).unref?.();
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
  return artifact;
}


function compactSnippet(text, term, radius = 140) {
  const source = String(text || '');
  const index = source.toLowerCase().indexOf(String(term || '').toLowerCase());
  if (index < 0) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + String(term).length + radius);
  return redactText(source.slice(start, end)).replace(/\s+/g, ' ').slice(0, radius * 2 + 80);
}


function signatureTerms(platform = 'generic') {
  return platform === 'xhs'
    ? ['x-s-common', 'x-s', 'x-t', 'xsec_token', 'web_session', 'a1', 'b1', 'captcha', 'verify', 'webmsxyw', 'redmoons']
    : platform === 'bili'
      ? ['w_rid', 'wts', 'wbi', 'mixinKey', 'buvid', 'playurl', 'x/player/wbi', 'nav', 'fingerprint']
      : ['x-s', 'x-t', 'token', 'signature', 'verify'];
}
function signatureHeaderRe(platform = 'generic') {
  return platform === 'xhs'
    ? /^x-s$|^x-t$|^x-s-common$|^x-b3-traceid|^x-xray-traceid/i
    : platform === 'bili'
      ? /w_rid|wts|buvid|fingerprint|bili|signature|token|x-/i
      : /signature|token|x-/i;
}
function signatureUrlRe(platform = 'generic') {
  return platform === 'xhs'
    ? /[?&](?:xsec_token|web_session|a1|b1)=|\/api\/sns\/(?:web|h5)\//i
    : platform === 'bili'
      ? /[?&](?:w_rid|wts|buvid)=|\/x\/player\/wbi\/|\/x\/web-interface\/nav|\/x\/player\/playurl/i
      : /signature|token|sign/i;
}
async function collectExternalBundleHints(cdp, platform = 'generic') {
  const terms = signatureTerms(platform);
  const urls = unique((cdp.requests || [])
    .map((request) => request.rawUrl || request.url || '')
    .filter((url) => /\.m?js(?:[?#]|$)|\/static\/js\/|\/bfs\/static\//i.test(url))
    .filter((url) => !/^data:/i.test(url)))
    .slice(0, Number(process.env.RECON_BUNDLE_FETCH_LIMIT || 12));
  const hints = [];
  for (const url of urls) {
    try {
      const item = await fetchText(url, { headers: { referer: cdp.target || '', accept: '*/*' } });
      const text = item.text || '';
      const hits = unique(terms.filter((term) => text.toLowerCase().includes(term.toLowerCase())));
      const highSignalHits = platform === 'bili' ? hits.filter((term) => /w_rid|wts|wbi|mixinkey|buvid|playurl|x\/player\/wbi/i.test(term)) : hits;
      if (!hits.length || !highSignalHits.length) continue;
      hints.push({
        url: redactUrl(url),
        length: text.length,
        sha256: item.sha256,
        source: 'external-js-fetch',
        hits,
        snippets: hits.slice(0, 4).map((term) => ({ term, snippet: compactSnippet(text, term) })),
      });
    } catch (error) {
      hints.push({ url: redactUrl(url), source: 'external-js-fetch', error: error instanceof Error ? error.message : String(error) });
    }
  }
  return hints.filter((hint) => hint.hits?.length).slice(0, 20);
}

function analyzeSignatureTrace(cdp, platform = 'generic') {
  const terms = signatureTerms(platform);
  const headerRe = signatureHeaderRe(platform);
  const urlRe = signatureUrlRe(platform);
  const requests = cdp.requests || [];
  const responses = cdp.responses || [];
  const bodies = cdp.bodies || [];
  const signedRequests = requests.filter((request) => Object.keys(request.headers || {}).some((name) => headerRe.test(name)) || urlRe.test(request.rawUrl || request.url || ''));
  const apiTimeline = requests
    .filter((request) => platform === 'xhs' ? /\/api\/sns\/(?:web|h5)\//i.test(request.rawUrl || request.url || '') : platform === 'bili' ? /api\.bilibili\.com\/x\/|\/x\/player|\/x\/web-interface/i.test(request.rawUrl || request.url || '') : /\/api\//i.test(request.rawUrl || request.url || ''))
    .slice(0, 80)
    .map((request, index) => {
      const response = responses.find((item) => item.id === request.id);
      return {
        index,
        id: request.id,
        type: request.type,
        method: request.method,
        url: redactUrl(request.rawUrl || request.url),
        status: response?.status,
        mimeType: response?.mimeType,
        signatureHeaders: Object.keys(request.headers || {}).filter((name) => headerRe.test(name)).sort(),
      };
    });
  const bundleHints = bodies
    .filter((body) => /javascript|ecmascript|text\/plain/i.test(body.mimeType || '') || /\.m?js(?:\?|$)/i.test(body.url || ''))
    .map((body) => {
      const bodyText = String(body.text || '');
      const hits = unique(terms.filter((term) => bodyText.toLowerCase().includes(term.toLowerCase())));
      if (!hits.length) return null;
      return {
        url: redactUrl(body.url),
        length: body.length,
        sha256: body.sha256,
        hits,
        snippets: hits.slice(0, 4).map((term) => ({ term, snippet: compactSnippet(bodyText, term) })),
      };
    })
    .filter(Boolean)
    .slice(0, 20);
  const observedHeaderNames = unique(signedRequests.flatMap((request) => Object.keys(request.headers || {}).filter((name) => headerRe.test(name)))).sort();
  const storageKeyHints = unique(Object.entries(cdp.storage || {})
    .flatMap(([area, value]) => typeof value === 'object' && value ? Object.keys(value).map((key) => `${area}.${key}`) : [])
    .filter((key) => terms.some((term) => key.toLowerCase().includes(term.toLowerCase()))))
    .slice(0, 40);
  const signerLog = (cdp.storage?.piReconSignerLog || [])
    .filter((entry) => terms.some((term) => JSON.stringify(entry).toLowerCase().includes(term.toLowerCase())))
    .slice(0, 80)
    .map((entry) => ({ ...entry, url: entry.url ? redactUrl(entry.url) : undefined, stack: redactText(entry.stack || '').slice(0, 900) }));
  const signerKinds = Object.fromEntries(Object.entries(signerLog.reduce((acc, entry) => {
    acc[entry.kind || 'unknown'] = (acc[entry.kind || 'unknown'] || 0) + 1;
    return acc;
  }, {})).sort());
  return {
    platform,
    observedHeaderNames,
    signedRequestCount: signedRequests.length,
    signedRequests: signedRequests.slice(0, 40).map((request) => ({ id: request.id, type: request.type, method: request.method, url: redactUrl(request.rawUrl || request.url), signedUrl: urlRe.test(request.rawUrl || request.url || ''), headerNames: Object.keys(request.headers || {}).filter((name) => headerRe.test(name)).sort() })),
    apiTimeline,
    bundleHints,
    storageKeyHints,
    signerLog,
    signerKinds,
  };
}

function stripStorage(storage = {}) {
  const sanitizeValue = (value) => {
    if (Array.isArray(value)) return value.slice(0, 600).map(sanitizeValue);
    if (typeof value === 'string') return redactText(redactUrl(value)).slice(0, 4000);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, inner]) => [
        key,
        /cookie|authorization|token|session|csrf|xsrf|a1|b1|x-s|x-t|xsec|buvid|w_rid/i.test(key) ? '<redacted>' : sanitizeValue(inner),
      ]));
    }
    return value;
  };
  const out = {};
  for (const [key, value] of Object.entries(storage || {})) {
    if (key === 'cookies') out[key] = value ? '<redacted>' : '';
    else if (key === 'html') out[key] = redactText(value);
    else if (typeof value === 'string') out[key] = redactText(value).slice(0, maxBodyBytes);
    else out[key] = sanitizeValue(value);
  }
  return out;
}

function stripRuntimeSecrets(cdp) {
  return {
    ...cdp,
    storage: stripStorage(cdp.storage || {}),
    requests: (cdp.requests || []).map(({ rawUrl, replayHeaders, ...request }) => ({ ...request, url: redactUrl(request.url) })),
    responses: (cdp.responses || []).map((response) => ({ ...response, url: redactUrl(response.url) })),
    bodies: (cdp.bodies || []).map((body) => ({ ...body, url: redactUrl(body.url), text: redactText(body.text || '').slice(0, maxBodyBytes) })),
  };
}

async function replayXhsReadOnly(cdp) {
  const seed = (cdp.requests || []).find((request) => request.method === 'GET' && /\/api\/sns\/h5\/v1\/note_info/i.test(request.rawUrl || request.url || ''))
    || (cdp.requests || []).find((request) => request.method === 'GET' && /\/api\/sns\/web\//i.test(request.rawUrl || request.url || ''));
  if (!seed) return { attempted: false, reason: 'no read-only XHS API GET seed captured' };
  const headers = { ...(seed.replayHeaders || {}) };
  for (const key of Object.keys(headers)) if (/^(host|content-length|accept-encoding|connection|sec-fetch-|cookie)$/i.test(key)) delete headers[key];
  const observedResponse = (cdp.responses || []).find((response) => response.id === seed.id);
  const observedBody = (cdp.bodies || []).find((body) => body.id === seed.id);
  try {
    const response = await fetch(seed.rawUrl || seed.url, { method: 'GET', redirect: 'manual', headers });
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = buffer.subarray(0, 1200).toString('utf8');
    const parsed = safeJsonParse(text, {});
    const headerNames = Object.keys(headers).sort();
    return {
      attempted: true,
      url: redactUrl(seed.rawUrl || seed.url),
      status: response.status,
      headers: sanitizeHeaders(Object.fromEntries(response.headers.entries())),
      bytes: buffer.length,
      sha256: sha256(buffer).slice(0, 24),
      jsonCode: parsed?.code,
      success: parsed?.success,
      seed: {
        id: seed.id,
        endpointClass: /\/api\/sns\/h5\//i.test(seed.rawUrl || seed.url || '') ? 'h5-note-info' : 'web-api',
        observedStatus: observedResponse?.status,
        observedMimeType: observedResponse?.mimeType,
        observedBodySha256: observedBody?.sha256,
      },
      replayDivergence: observedResponse ? {
        statusChanged: Number(observedResponse.status) !== Number(response.status),
        observedStatus: observedResponse.status,
        replayStatus: response.status,
        observedBodySha256: observedBody?.sha256,
        replayBodySha256: sha256(buffer).slice(0, 24),
      } : undefined,
      headerNames,
      signedHeaderNames: headerNames.filter((name) => /^x-s$|^x-t$|^x-s-common$|^x-b3-traceid|^x-xray-traceid/i.test(name)),
      bodyHead: redactText(text),
    };
  } catch (error) {
    return { attempted: true, url: redactUrl(seed.rawUrl || seed.url), status: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}

function analyzeXhs(url, cdp) {
  const text = [cdp.storage?.html || '', JSON.stringify(cdp.storage || {}), ...(cdp.bodies || []).map((b) => b.text || ''), ...(cdp.requests || []).map((r) => r.url || ''), ...(cdp.responses || []).map((r) => r.url || '')].join('\n');
  const noteIds = unique([String(url).match(/explore\/([0-9a-f]{24})/i)?.[1], ...[...text.matchAll(/(?:note_id|noteId|id)["']?\s*[:=]\s*["']?([0-9a-f]{24})/gi)].map((m) => m[1]), ...[...text.matchAll(/explore\/([0-9a-f]{24})/gi)].map((m) => m[1])]);
  const webApis = unique((cdp.requests || []).map((r) => r.url).filter((u) => /\/api\/sns\/web|edith|xiaohongshu\.com\/api|xsec|web_session/i.test(u || '')));
  const antiBot = unique([...[...text.matchAll(/x-s-common|x-s|x-t|xsec_token|web_session|a1|b1|unread|captcha|verify/gi)].map((m) => m[0])]);
  const imagePattern = new RegExp('https?:\\/\\/[^\\n\"\'<>]+(?:sns-webpic|xhscdn|xhscdn\\.com|xiaohongshu)[^\\n\"\'<>]+', 'gi');
  const images = unique([...text.matchAll(imagePattern)].map((m) => redactUrl(m[0]))).slice(0, 40);
  const verdict = noteIds.length && webApis.length ? 'xhs-note-runtime-api-captured' : noteIds.length ? 'xhs-note-id-captured-api-gated' : antiBot.length ? 'xhs-anti-bot-surface-captured' : 'xhs-runtime-capture-inconclusive';
  return { verdict, noteIds, webApiHints: webApis.map(redactUrl).slice(0, 80), antiBotSignals: antiBot.slice(0, 40), imageHints: images, browser: { requests: cdp.requests.length, responses: cdp.responses.length, bodies: cdp.bodies.length, failures: cdp.failures.length, errors: cdp.errors } };
}

async function runXhs(url, outDir) {
  const cdp = await captureCdp(url, outDir);
  const xhsReplay = await replayXhsReadOnly(cdp);
  const signatureTrace = analyzeSignatureTrace(cdp, 'xhs');
  if (xhsReplay.replayDivergence) signatureTrace.replayDivergence = xhsReplay.replayDivergence;
  const safeCdp = stripRuntimeSecrets(cdp);
  await writeFile(join(outDir, 'browser.json'), `${JSON.stringify(safeCdp, null, 2)}\n`);
  if (safeCdp.storage?.html) await writeFile(join(outDir, 'browser.html'), safeCdp.storage.html);
  const analysis = analyzeXhs(url, cdp);
  const replayStatus = Number(xhsReplay.status);
  const verdict = xhsReplay.attempted && replayStatus >= 200 && replayStatus < 300
    ? 'xhs-note-signed-api-replay-confirmed'
    : xhsReplay.attempted && (replayStatus === 461 || xhsReplay.headers?.verifytype)
      ? 'xhs-signed-api-challenge-reproduced'
      : analysis.verdict;
  return { ...analysis, verdict, xhsReplay, signatureTrace, browserArtifact: join(outDir, 'browser.json'), nextActions: ['classify /api/sns/web/* endpoints and required x-s/x-t/x-s-common headers', 'trace signer bundle snippets for x-s/x-t/x-s-common generation', 'compare captured response vs replay divergence before rebuilding signer'] };
}

async function runGeneric(url, outDir) {
  const cdp = await captureCdp(url, outDir);
  const signatureTrace = analyzeSignatureTrace(cdp, 'generic');
  await writeFile(join(outDir, 'browser.json'), `${JSON.stringify(stripRuntimeSecrets(cdp), null, 2)}\n`);
  return { verdict: cdp.responses?.length ? 'generic-cdp-captured' : 'generic-cdp-no-response', browser: { requests: cdp.requests.length, responses: cdp.responses.length, bodies: cdp.bodies.length, failures: cdp.failures.length, errors: cdp.errors }, signatureTrace, browserArtifact: join(outDir, 'browser.json'), nextActions: ['inspect browser.json for APIs, signatures, storage, websocket anchors'] };
}

if (selfTestOnly) {
  const selfTest = biliWbiSelfTest();
  console.log(JSON.stringify({ ok: selfTest.ok, profile: 'bilibili-video', component: 'wbi-signer', selfTest }, null, 2));
  process.exit(selfTest.ok ? 0 : 1);
}

const url = assertHttpUrl(target);
const profile = detectProfile(url);
const outDir = join('.pi', 'evidence', 'remote', 'real-platform', slug(profile), slug(url.hostname), timestamp());
await mkdir(outDir, { recursive: true });
const started = Date.now();
let result;
if (profile === 'bilibili-video') result = await runBilibili(url, outDir);
else if (profile === 'xiaohongshu-note') result = await runXhs(url, outDir);
else result = await runGeneric(url, outDir);
result = { target: redactUrl(url.toString()), profile, artifactDir: outDir, elapsedMs: Date.now() - started, ...result };
await writeFile(join(outDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);

const md = [
  '# Pi-RECON Real Platform Hard Benchmark Artifact',
  '',
  `target: ${result.target}`,
  `profile: ${profile}`,
  `verdict: ${result.verdict}`,
  `artifact_dir: ${outDir}`,
  '',
  '## Key Evidence',
  ...(profile === 'bilibili-video' ? [
    `- bvid=${result.bvid || 'none'} aid=${result.aid || 'none'} cid=${result.cid || 'none'}`,
    `- title=${result.title || 'none'}`,
    `- view_code=${result.view?.code} nav_code=${result.nav?.code} wbi_img=${result.nav?.hasWbiImg} wbi_mixin_sha=${result.nav?.mixinKeySha256 || 'none'}`,
    `- playurl_profiles=${(result.playurls || []).map((p) => `${p.signed ? 'wbi-' : ''}${p.fnval}:${p.code}:q${p.quality}`).join(', ')}`,
    `- media_candidates=${result.mediaCandidates?.length || 0} reachable_media_probes=${(result.probes || []).filter((p) => p.probe.classification.media && p.probe.classification.reachable).length}`,
    `- wbi_selftest=${result.wbiRegression?.selfTest?.ok} media_probe_matrix=${JSON.stringify(result.mediaProbeMatrix || {})}`,
    `- browser=${result.browser ? JSON.stringify(result.browser) : 'not-run'} signature_trace bundles=${result.signatureTrace?.bundleHints?.length || 0} signer_events=${result.signatureTrace?.signerLog?.length || 0}`,
  ] : profile === 'xiaohongshu-note' ? [
    `- note_ids=${result.noteIds?.join(', ') || 'none'}`,
    `- web_api_hints=${result.webApiHints?.length || 0}`,
    `- anti_bot_signals=${result.antiBotSignals?.join(', ') || 'none'}`,
    `- browser=${JSON.stringify(result.browser)}`,
    `- signed_replay=${result.xhsReplay?.attempted ? `${result.xhsReplay.status} code=${result.xhsReplay.jsonCode ?? 'none'} signed_headers=${(result.xhsReplay.signedHeaderNames || []).join(',')}` : 'not-attempted'}`,
    `- signature_trace signed_requests=${result.signatureTrace?.signedRequestCount || 0} bundles=${result.signatureTrace?.bundleHints?.length || 0} headers=${(result.signatureTrace?.observedHeaderNames || []).join(',') || 'none'}`,
  ] : [`- browser=${JSON.stringify(result.browser)}`]),
  '',
  '## Probe / API Matrix',
  ...(profile === 'bilibili-video'
    ? [
        ...(result.playurls || []).map((p) => `- playurl${p.signed ? '-wbi' : ''} fnval=${p.fnval} status=${p.status} code=${p.code} quality=${p.quality} dash=${p.hasDash} durl=${p.durlCount} wts=${p.wts || ''} wRidSha256=${p.wRidSha256 || ''}`),
        ...(result.signatureTrace?.bundleHints || []).slice(0, 12).map((hint) => `- signer-bundle hits=${hint.hits.join(',')} len=${hint.length || 0} sha=${hint.sha256 || ''} url=${hint.url}`),
        ...(result.signatureTrace?.signerLog || []).slice(0, 20).map((item) => `- signer-event kind=${item.kind} key=${item.key || ''} url=${item.url || ''}`),
        ...(result.probes || []).slice(0, 20).map((p) => `- media ${p.kind} id=${p.id || ''} reachable=${p.probe.classification.reachable} media=${p.probe.classification.media} url=${redactUrl(p.url)}`),
      ]
    : profile === 'xiaohongshu-note'
      ? [
          ...(result.xhsReplay?.attempted ? [`- signed-replay status=${result.xhsReplay.status} jsonCode=${result.xhsReplay.jsonCode ?? 'none'} success=${result.xhsReplay.success ?? 'none'} signedHeaders=${(result.xhsReplay.signedHeaderNames || []).join(',')} url=${result.xhsReplay.url}`] : []),
          ...(result.signatureTrace?.bundleHints || []).slice(0, 12).map((hint) => `- signer-bundle hits=${hint.hits.join(',')} len=${hint.length || 0} sha=${hint.sha256 || ''} url=${hint.url}`),
          ...(result.signatureTrace?.apiTimeline || []).slice(0, 20).map((item) => `- api ${item.method || ''} status=${item.status ?? ''} signed=${(item.signatureHeaders || []).join(',')} url=${item.url}`),
          ...(result.webApiHints || []).slice(0, 30).map((u) => `- ${u}`),
        ]
      : []),
  '',
  '## Verification',
  `- JSON: ${join(outDir, 'result.json')}`,
  result.browserArtifact ? `- Browser artifact: ${result.browserArtifact}` : '- Browser artifact: not generated',
  '- Media probes use HEAD or range requests only; no full video download is performed.',
  '',
  '## Next Step',
  ...(result.nextActions || []).map((x) => `- ${x}`),
  '',
].join('\n');
await writeFile(join(outDir, 'artifact.md'), md);
console.log(JSON.stringify({ target: result.target, profile, verdict: result.verdict, artifactDir: outDir, key: profile === 'bilibili-video' ? { bvid: result.bvid, cid: result.cid, mediaProbes: result.probes?.length || 0 } : result.browser }, null, 2));
