/** Web authz deep probes: method matrix + header/auth surface without full browser. */
export function webAuthzScriptDeep(): string {
	return `// deep method/authz surface after principal matrix
const deepMethods = (process.env.REPI_AUTHZ_METHODS || 'GET,HEAD,OPTIONS,POST').split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
const deepPath = process.env.REPI_AUTHZ_DEEP_PATH || process.env.REPI_OBJECT_PATH || '/api/users/1';
let deepUrl;
try { deepUrl = new URL(deepPath, target).toString(); } catch (_) {
  deepUrl = (target.endsWith('/') ? target.slice(0, -1) : target) + deepPath;
}
const methodRows = [];
for (const principal of principals) {
  for (const method of deepMethods.slice(0, 6)) {
    try {
      const row = await fetchState(principal, deepUrl, method, method === 'POST' || method === 'PUT' || method === 'PATCH' ? (process.env.REPI_AUTHZ_DEEP_BODY || '{}') : undefined);
      methodRows.push({ principal, method, status: row.status, hash: row.hash, cookie: row.cookiePresent, auth: row.authPresent });
      console.log('[web-authz-method]', 'principal=' + principal, 'method=' + method, 'status=' + row.status, 'hash=' + row.hash, 'cookie=' + Number(!!row.cookiePresent), 'auth=' + Number(!!row.authPresent));
    } catch (e) {
      console.log('[web-authz-method]', 'principal=' + principal, 'method=' + method, 'error=' + (e && e.message ? e.message : String(e)));
    }
  }
}
// Cross-principal method divergence: same method, different status/hash between A and B
const byMethod = {};
for (const r of methodRows) {
  if (!byMethod[r.method]) byMethod[r.method] = [];
  byMethod[r.method].push(r);
}
let methodDiff = 0;
for (const method of Object.keys(byMethod)) {
  const rows = byMethod[method];
  const a = rows.find(function (r) { return r.principal === 'A'; });
  const b = rows.find(function (r) { return r.principal === 'B'; });
  if (a && b && (a.status !== b.status || a.hash !== b.hash)) {
    methodDiff += 1;
    console.log('[web-authz-method-diff]', 'method=' + method, 'a_status=' + a.status, 'b_status=' + b.status, 'same_hash=' + String(a.hash === b.hash), 'potential_authz_gap=true');
  }
}
console.log('[web-authz-method-matrix]', 'methods=' + deepMethods.join(','), 'rows=' + methodRows.length, 'diffs=' + methodDiff);
// CSRF-ish: POST without cookie/auth vs with cookie for principal A
if (deepMethods.indexOf('POST') >= 0) {
  try {
    const withAuth = methodRows.find(function (r) { return r.principal === 'A' && r.method === 'POST'; });
    const anonPost = methodRows.find(function (r) { return r.principal === 'anon' && r.method === 'POST'; });
    if (withAuth && anonPost) {
      console.log('[web-authz-csrf-surface]', 'anon_post=' + anonPost.status, 'a_post=' + withAuth.status, 'gap=' + String(anonPost.status === withAuth.status));
    }
  } catch (_) {}
}
globalThis.__repiAuthzMethodDiff = methodDiff;
globalThis.__repiAuthzMethodRows = methodRows.length;
console.log('[web-authz-deep] ok=1 method_rows=' + methodRows.length + ' method_diffs=' + methodDiff);
`;
}
