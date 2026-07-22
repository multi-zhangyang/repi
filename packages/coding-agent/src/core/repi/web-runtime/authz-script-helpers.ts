/** Web authz embedded script: helpers + principal matrix. */
export function webAuthzScriptPrincipalMatrix(): string {
	return `import crypto from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const target = process.argv[2] || process.env.REPI_URL || '';
const principals = (process.env.REPI_AUTHZ_PRINCIPALS || 'anon,A,B').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
const limit = Math.max(1, Math.min(25, Number(process.env.REPI_AUTHZ_LIMIT || '8')));
function boolEnv(name) { return /^(1|true|yes|on)$/i.test(process.env[name] || ''); }
function warnEnv(name, purpose) { if (!process.env[name]) console.log('[web-authz-warn]', 'missing_env=' + name, 'purpose=' + purpose); }
function digest(buf) { return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16); }
function principalHeaders(name) {
  const suffix = name.toUpperCase();
  const headers = { 'User-Agent': 'REPI-web-authz-state/' + name };
  const cookie = process.env['COOKIE_' + suffix] || (name === 'anon' ? '' : process.env.COOKIE_A || '');
  const auth = process.env['AUTH_' + suffix] || (name === 'anon' ? '' : process.env.AUTH_A || '');
  if (cookie) headers.Cookie = cookie;
  if (auth) headers.Authorization = auth;
  return { headers, cookiePresent: Boolean(cookie), authPresent: Boolean(auth) };
}
function routePath(raw) { try { return new URL(raw, target || 'http://127.0.0.1/').pathname; } catch (_) { return raw || '<missing>'; } }
function sequenceUrls() {
  const seq = process.env.REPI_AUTHZ_SEQUENCE || target;
  return seq.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, limit);
}
async function fetchState(principal, url, method, body) {
  const meta = principalHeaders(principal);
  const init = { method: method || 'GET', headers: meta.headers, redirect: 'manual' };
  if (body) { init.body = body; init.headers['Content-Type'] = process.env.REPI_AUTHZ_CONTENT_TYPE || 'application/json'; }
  try {
    const response = await fetch(url, init);
    const data = Buffer.from(await response.arrayBuffer());
    const setCookie = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    const cookieHeader = response.headers.get('set-cookie') || '';
    const setCookies = (setCookie && setCookie.length) ? setCookie : (cookieHeader ? [cookieHeader] : []);
    return {
      principal, method: init.method, url, route: routePath(url), status: response.status,
      bytes: data.length, hash: digest(data),
      bodyText: data.toString('utf8').slice(0, 4000),
      cookiePresent: meta.cookiePresent, authPresent: meta.authPresent,
      setCookieCount: setCookies.length,
      setCookieNames: setCookies.map(function (c) { return String(c).split('=')[0]; }).slice(0, 8),
    };
  } catch (error) {
    return { principal, method: init.method, url, route: routePath(url), status: 'ERR', bytes: 0, hash: 'ERR', error: String(error && error.message || error), cookiePresent: meta.cookiePresent, authPresent: meta.authPresent, setCookieCount: 0, setCookieNames: [] };
  }
}
const states = [];
if (!target) {
  console.log('[web-authz-blocked] reason=missing_url');
} else {
  for (const name of ['COOKIE_A', 'AUTH_A', 'COOKIE_B', 'AUTH_B']) warnEnv(name, 'optional principal credential; branch may be skipped or share anon state');
  for (const principal of principals) {
    const state = await fetchState(principal, target, 'GET');
    states.push(state);
    console.log('[web-authz-state]', 'principal=' + principal, 'route=' + state.route, 'method=' + state.method, 'status=' + state.status, 'bytes=' + state.bytes, 'hash=' + state.hash, 'cookie=' + (state.cookiePresent ? 1 : 0), 'auth=' + (state.authPresent ? 1 : 0), 'set_cookie=' + state.setCookieCount);
  }
  const route = states[0] ? states[0].route : routePath(target);
  const statusVector = states.map(function (s) { return s.principal + ':' + s.status + ':' + s.hash; }).join(',');
  const uniqueBodies = new Set(states.map(function (s) { return s.hash; })).size;
  const sameStatus = new Set(states.map(function (s) { return String(s.status); })).size === 1;
  console.log('[web-authz-matrix]', 'route=' + route, 'principals=' + principals.join(','), 'states=' + states.length, 'same_status=' + String(sameStatus), 'unique_bodies=' + uniqueBodies, 'vector=' + statusVector);
  // cookie / session differential across principals
  const cookieBits = states.map(function (s) { return s.principal + ':cookie=' + (s.cookiePresent ? 1 : 0) + ':auth=' + (s.authPresent ? 1 : 0) + ':set=' + s.setCookieCount + ':hash=' + s.hash; }).join(',');
  const cookieDifferential = new Set(states.map(function (s) { return String(s.cookiePresent) + ':' + String(s.authPresent) + ':' + s.hash; })).size > 1;
  const sessionSurface = states.some(function (s) { return s.setCookieCount > 0 || s.cookiePresent || s.authPresent; });
  console.log('[web-authz-cookie-diff]', 'principals=' + principals.join(','), 'session_surface=' + (sessionSurface ? 1 : 0), 'differential=' + (cookieDifferential ? 1 : 0), 'vector=' + cookieBits);
}
`;
}
