/** Web authz embedded script: objects/sequence/rollback + proof.exit footer. */
export function webAuthzScriptObjectsAndProof(): string {
	return `const objectA = process.env.REPI_OBJECT_A || '';
const objectB = process.env.REPI_OBJECT_B || '';
const objectChecks = [];
// default object probe: same target as objectA for A vs B when explicit objects missing but multi-principal cookies exist
const defaultObjectProbe = !objectA && !objectB && target && principals.filter(function (p) { return p !== 'anon'; }).length >= 1;
if (objectA && objectB) {
  const a = await fetchState('A', objectA, 'GET');
  const b = await fetchState('B', objectA, 'GET');
  const alt = await fetchState('A', objectB, 'GET');
  objectChecks.push({ owner: a, crossPrincipal: b, alternateObject: alt });
  console.log('[web-authz-object]', 'route=' + a.route, 'owner=A', 'principal_a_status=' + a.status, 'principal_b_status=' + b.status, 'same_body_ab=' + String(a.hash === b.hash), 'alt_status=' + alt.status, 'potential_bola=' + String(a.status === b.status && a.hash !== b.hash));
} else if (defaultObjectProbe) {
  const pathGuess = process.env.REPI_OBJECT_PATH || '/api/users/1';
  let objectUrl;
  try { objectUrl = new URL(pathGuess, target).toString(); } catch (_) { objectUrl = (target.endsWith('/') ? target.slice(0, -1) : target) + pathGuess; }
  const a = await fetchState('A', objectUrl, 'GET');
  const b = await fetchState('B', objectUrl, 'GET');
  const altPath = process.env.REPI_OBJECT_PATH_B || '/api/users/2';
  let altUrl;
  try { altUrl = new URL(altPath, target).toString(); } catch (_) { altUrl = (target.endsWith('/') ? target.slice(0, -1) : target) + altPath; }
  const alt = await fetchState('A', altUrl, 'GET');
  objectChecks.push({ owner: a, crossPrincipal: b, alternateObject: alt });
  console.log('[web-authz-object]', 'route=' + a.route, 'owner=A', 'principal_a_status=' + a.status, 'principal_b_status=' + b.status, 'same_body_ab=' + String(a.hash === b.hash), 'alt_status=' + alt.status, 'potential_bola=' + String(a.status === b.status && a.hash !== b.hash), 'probe=default_object_path');
} else {
  console.log('[web-authz-object]', 'status=skipped', 'reason=set_REPI_OBJECT_A_and_REPI_OBJECT_B');
}
const sequence = [];
for (const principal of principals.filter(function (p) { return p !== 'anon'; })) {
  const rows = [];
  for (const url of sequenceUrls()) rows.push(await fetchState(principal, url, 'GET'));
  sequence.push({ principal, rows });
  console.log('[web-authz-sequence]', 'principal=' + principal, 'steps=' + rows.length, 'statuses=' + rows.map(function (r) { return r.status; }).join(','), 'hashes=' + rows.map(function (r) { return r.hash; }).join(','));
}
let rollback = { skipped: true, reason: 'set_REPI_AUTHZ_MUTATE=1_and_REPI_MUTATION_URL' };
if (boolEnv('REPI_AUTHZ_MUTATE') && process.env.REPI_MUTATION_URL) {
  const url = process.env.REPI_MUTATION_URL;
  const method = process.env.REPI_MUTATION_METHOD || 'PATCH';
  const before = await fetchState('A', url, 'GET');
  const mutate = await fetchState('A', url, method, process.env.REPI_MUTATION_BODY || '{}');
  const restore = process.env.REPI_RESTORE_BODY ? await fetchState('A', url, method, process.env.REPI_RESTORE_BODY) : { status: 'SKIP', hash: 'SKIP' };
  const after = await fetchState('A', url, 'GET');
  let contentRestored = before.hash === after.hash;
  try {
    const bj = JSON.parse(before.bodyText || before.body || '{}');
    const aj = JSON.parse(after.bodyText || after.body || '{}');
    contentRestored = String(bj.note) === String(aj.note) && String(bj.owner) === String(aj.owner) && String(bj.id||'') === String(aj.id||'');
  } catch (_) {}
  rollback = { skipped: false, url, method, before, mutate, restore, after, restored: before.hash === after.hash || contentRestored, content_restored: contentRestored };
  console.log('[web-authz-rollback]', 'route=' + routePath(url), 'method=' + method, 'before=' + before.hash, 'mutate=' + mutate.hash, 'after=' + after.hash, 'restored=' + String(rollback.restored), 'content_restored=' + String(contentRestored));
} else {
  console.log('[web-authz-rollback]', 'status=skipped', 'reason=set_REPI_AUTHZ_MUTATE=1_and_REPI_MUTATION_URL');
}
const artifact = { target, principals, states, objectChecks, sequence, rollback, capturedAt: new Date().toISOString() };
const work = process.env.REPI_WORKDIR || (process.env.HOME + '/.repi/agent/recon/runtime/web-authz');
try { mkdirSync(work, { recursive: true }); } catch (_) {}
const artifactPath = work + '/repi-web-authz-state.json';
writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
console.log('[web-authz-artifact]', artifactPath);
const capRoute = states.length > 0 || Boolean(target) ? 1 : 0;
const capPrincipals = new Set(states.map(function (s) { return s.principal; })).size >= 2 || principals.length >= 2 ? 1 : 0;
const capObjects = objectChecks.length > 0 ? 1 : 0;
const capSeq = sequence.length > 0 ? 1 : 0;
const capRollback = rollback && !rollback.skipped ? 1 : 0;
const capIdor = objectChecks.some(function (c) { return c && c.owner && c.crossPrincipal && c.owner.status === c.crossPrincipal.status && c.owner.hash !== c.crossPrincipal.hash; }) ? 1 : 0;
const capMethod = (typeof globalThis !== 'undefined' && ((typeof globalThis.__repiAuthzMethodDiff === 'number' && globalThis.__repiAuthzMethodDiff > 0) || (typeof globalThis.__repiAuthzMethodRows === 'number' && globalThis.__repiAuthzMethodRows > 0))) ? 1 : 0;
const capCookieDiff = states.length >= 2 && (new Set(states.map(function (s) { return String(s.cookiePresent) + ':' + String(s.authPresent) + ':' + s.hash; })).size > 1 || states.some(function (s) { return s.setCookieCount > 0; })) ? 1 : 0;
console.log('[web-authz-proof-capture]', 'route=' + capRoute, 'principals=' + capPrincipals, 'objects=' + capObjects, 'sequence=' + capSeq, 'rollback=' + capRollback, 'idor=' + capIdor, 'cookie_diff=' + capCookieDiff, 'method_matrix=' + capMethod, 'states=' + states.length);
const strong = capRoute && capPrincipals && (capObjects || capSeq || capIdor || capRollback || capCookieDiff || capMethod);
const partial = capRoute && (capPrincipals || capSeq || states.length > 0);
const proofExit = strong ? 'runtime_capture_strong' : (partial ? 'partial_runtime_capture' : 'pending_runtime_capture');
console.log('[web-authz-proof-capture]', 'proof.exit=' + proofExit, 'bind_ready=' + (proofExit === 'pending_runtime_capture' ? 'false' : 'true'), 'note=principal-matrix-or-object-probe');
console.log('summary.proof_exit=' + proofExit);
console.log('summary.capture.route=' + capRoute);
console.log('summary.capture.principals=' + capPrincipals);
console.log('summary.capture.objects=' + capObjects);
console.log('summary.capture.sequence=' + capSeq);
console.log('summary.capture.rollback=' + capRollback);
console.log('summary.capture.idor=' + capIdor);
console.log('summary.capture.cookie_diff=' + capCookieDiff);
console.log('summary.capture.method_matrix=' + capMethod);
`;
}
