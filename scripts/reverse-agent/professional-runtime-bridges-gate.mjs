#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/professional-runtime-bridges.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/professional-runtime-bridges.fixture.json";

const REQUIRED_GATES = [
  "professional_runtime_bridge_gate",
  "runtime_execution_bridge_matrix",
  "real_toolchain_bridge_contract",
  "exploit_verifier_runtime_contract",
  "web_cdp_replay_contract",
  "mobile_frida_dynamic_bridge_contract",
  "artifact_backed_tool_execution_plan",
  "env_ref_secret_boundary",
  "runtime:professional-runtime-bridges",
];

const BRIDGE_SPECS = [
  {
    id: "tool-bridge-runtime",
    title: "真实工具链桥接总控",
    domains: ["rev-native", "pwn", "web-cdp", "mobile-frida", "pcap-dfir", "firmware-iot"],
    preferredTools: ["ghidra", "r2", "rabin2", "angr", "gdb", "gef", "pwndbg", "checksec", "ROPgadget", "one_gadget", "seccomp-tools", "tshark", "volatility3", "binwalk", "qemu-arm", "frida", "adb", "jadx"],
    fallbackTools: ["file", "strings", "readelf", "objdump", "python3", "node", "curl", "unzip"],
    commandTemplates: [
      "bridge-rev-ghidra-r2-angr: re_runtime_bridge show tool-bridge-runtime && re_native_runtime plan <target>",
      "bridge-pwn-pwntools-checksec-rop: re_toolchain_domain show pwn && re_exploit_lab run <target> 5",
      "bridge-web-cdp-http-replay: re_runtime_bridge show web-cdp-replay && re_live_browser run <url>",
      "bridge-mobile-frida-adb-jadx: re_runtime_bridge show mobile-frida && re_mobile_runtime run <apk-or-package>",
      "bridge-dfir-tshark-volatility: re_lane plan pcap-dfir <artifact> && re_verifier matrix",
      "bridge-firmware-binwalk-qemu: re_lane plan firmware-iot <image> && re_proof_loop run <image>",
    ],
    artifactPlan: [".repi/evidence/toolchain/<timestamp>-professional-runtime-bridges.md", ".repi/evidence/runs/<mission>/tool-output-hashes.json", ".repi/recon/memory/tool-bridge-ledger.jsonl"],
    envRefs: ["REPI_TOOLBRIDGE_TIMEOUT_MS", "REPI_TOOLBRIDGE_WORKDIR", "REPI_ANDROID_SERIAL", "REPI_FRIDA_DEVICE", "REPI_BROWSER_CDP_URL"],
    proofExit: ["tool presence discovery", "fallback command generation", "artifact path plan", "proof-exit mapping", "no narrative-only bridge"],
  },
  {
    id: "exploit-verifier-runtime",
    title: "自动利用验证闭环",
    domains: ["pwn", "web-api", "frontend-js", "mobile-frida"],
    preferredTools: ["gdb", "pwntools", "checksec", "ROPgadget", "one_gadget", "curl", "playwright", "frida"],
    fallbackTools: ["python3", "node", "bash", "sh", "curl"],
    commandTemplates: [
      "verifier-pwn-crash-offset-primitive-exploit: re_exploit_lab run <target> 5 && re_verifier matrix",
      "verifier-web-replay-diff: re_replayer run <captured-request> 3 && re_domain_proof_exit write web-api",
      "verifier-js-signing-replay: re_live_browser run <url> && re_replayer run <signed-request> 3",
      "verifier-mobile-hook-output: re_mobile_runtime run <package> && re_verifier check",
      "verifier-regression-bundle: re_proof_loop run <target> 4 2 && re_complete audit",
    ],
    artifactPlan: [".repi/evidence/runs/<mission>/exploit-verifier-matrix.json", ".repi/evidence/runs/<mission>/stdout-stderr-hashes.json", ".repi/evidence/reports/<mission>-replay-verifier.md"],
    envRefs: ["REPI_EXPLOIT_VERIFY_RUNS", "REPI_EXPLOIT_VERIFY_TIMEOUT_MS", "REPI_REPLAY_BASE_URL", "REPI_FRIDA_DEVICE"],
    proofExit: ["crash-to-offset proof", "primitive control evidence", "multi-run verifier", "stdout/stderr hash", "state rollback proof"],
  },
  {
    id: "web-cdp-replay",
    title: "Web/CDP replay harness",
    domains: ["web-api", "frontend-js", "web-scan"],
    preferredTools: ["playwright", "mitmproxy", "httpx", "ffuf", "nuclei", "jq"],
    fallbackTools: ["curl", "node", "python3", "rg"],
    commandTemplates: [
      "cdp-network-capture: re_runtime_bridge show web-cdp-replay && re_live_browser run <url>",
      "cdp-xhr-ws-route-extraction: re_lane plan frontend-js <url> && re_knowledge_graph build",
      "cdp-cookie-session-isolation: re_web_authz_state run <url> 45000",
      "cdp-signed-request-replay: re_replayer run <request-artifact> 3",
      "cdp-authz-request-order-proof: re_domain_proof_exit write web-api",
      "cdp-blocked-mutation-operator-command: re_operator plan <target>",
    ],
    artifactPlan: [".repi/evidence/browser/<mission>/cdp-network.har", ".repi/evidence/browser/<mission>/xhr-ws-routes.json", ".repi/evidence/browser/<mission>/signed-replay-diff.json", ".repi/evidence/browser/<mission>/request-order-proof.md"],
    envRefs: ["REPI_BROWSER_CDP_URL", "REPI_BROWSER_PROFILE_DIR", "REPI_REPLAY_BASE_URL", "REPI_SESSION_COOKIE_REF"],
    proofExit: ["CDP network capture", "XHR/WS route extraction", "cookie/session isolation", "signed request replay", "authz replay matrix", "request order proof"],
  },
  {
    id: "mobile-frida",
    title: "Frida/Mobile 动态分析桥接",
    domains: ["mobile", "mobile-ios", "rev-native"],
    preferredTools: ["frida", "frida-ps", "objection", "adb", "jadx", "apktool", "aapt", "class-dump", "otool", "codesign", "ios-deploy"],
    fallbackTools: ["unzip", "strings", "file", "python3", "node"],
    commandTemplates: [
      "mobile-apk-ipa-static-triage: re_runtime_bridge show mobile-frida && re_mobile_runtime plan <apk-or-ipa>",
      "mobile-frida-java-hook-template: frida -U -f <package> -l hooks/java-crypto.js --no-pause",
      "mobile-frida-objc-swift-hook-template: frida -U -f <bundle> -l hooks/objc-keychain.js --no-pause",
      "mobile-keystore-keychain-certpin-anchors: re_verifier check <mobile-artifact>",
      "mobile-runtime-attach-env-gate: REPI_FRIDA_DEVICE=<device> re_mobile_runtime run <package>",
      "mobile-hook-output-artifact-contract: re_domain_proof_exit write mobile",
    ],
    artifactPlan: [".repi/evidence/mobile/<mission>/static-triage.json", ".repi/evidence/mobile/<mission>/frida-hook-output.jsonl", ".repi/evidence/mobile/<mission>/cert-pinning-anchors.md", ".repi/evidence/mobile/<mission>/runtime-attach-manifest.json"],
    envRefs: ["REPI_FRIDA_DEVICE", "REPI_ANDROID_SERIAL", "REPI_IOS_BUNDLE_ID", "REPI_MOBILE_RUNTIME_TIMEOUT_MS"],
    proofExit: ["APK/IPA static triage", "Java/ObjC/Swift method anchors", "keystore/keychain/cert pinning anchors", "runtime attach env gate", "hook output artifact contract"],
  },
];

const NEGATIVE_CASES = [
  "missing-fallback-template",
  "missing-proof-exit",
  "literal-secret-in-env-ref",
  "narrative-only-bridge",
  "missing-artifact-plan",
  "missing-web-cdp-contract",
  "missing-mobile-frida-contract",
];

const sha256 = (value) => createHash("sha256").update(String(value ?? "")).digest("hex");
const shortHash = (value) => sha256(value).slice(0, 24);
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const readText = (path) => readFileSync(join(root, path), "utf8");
const maybeRead = (path) => (existsSync(join(root, path)) ? readText(path) : "");

function commandExists(tool) {
  const probe = spawnSync("sh", ["-lc", `command -v ${JSON.stringify(tool)} 2>/dev/null || true`], { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 });
  const path = String(probe.stdout || "").trim().split(/\r?\n/)[0] || undefined;
  return { tool, present: Boolean(path), path, exitCode: probe.status ?? 0 };
}

function markerRow(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false, missing: markers });
  const text = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !text.includes(marker));
  return check(id, missing.length === 0, { path, missing, markerCount: markers.length, sha256: shortHash(text) });
}

function fixtureRows() {
  try {
    const fixture = JSON.parse(readText(FIXTURE_PATH));
    return Array.isArray(fixture.bridges) ? fixture.bridges : [];
  } catch {
    return [];
  }
}

function secretLike(value) {
  return /(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,}|AKIA[0-9A-Z]{12,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/.test(String(value ?? ""));
}

function buildReport() {
  const allTools = Array.from(new Set(BRIDGE_SPECS.flatMap((bridge) => [...bridge.preferredTools, ...bridge.fallbackTools]))).sort();
  const discovery = Object.fromEntries(allTools.map((tool) => [tool, commandExists(tool)]));
  const corpus = [
    maybeRead("packages/coding-agent/src/core/recon-profile.ts"),
    maybeRead("repi-profile/extensions/reverse-pentest-core.ts"),
    maybeRead("README.md"),
    maybeRead("docs/reverse-agent/README.md"),
    maybeRead("packages/coding-agent/docs/recon.md"),
    JSON.stringify(fixtureRows()),
  ].join("\n---REPI_PROFESSIONAL_RUNTIME_BRIDGES_CORPUS---\n");
  const bridges = BRIDGE_SPECS.map((bridge) => {
    const presentPreferred = bridge.preferredTools.filter((tool) => discovery[tool]?.present);
    const presentFallbacks = bridge.fallbackTools.filter((tool) => discovery[tool]?.present);
    const missingPreferred = bridge.preferredTools.filter((tool) => !discovery[tool]?.present);
    const commandMarkersFound = bridge.commandTemplates.filter((template) => corpus.includes(template.split(":")[0]));
    const proofExitFound = bridge.proofExit.filter((marker) => corpus.includes(marker));
    const artifactPlanOk = bridge.artifactPlan.length >= 3 && bridge.artifactPlan.every((path) => path.startsWith(".repi/evidence") || path.startsWith(".repi/recon"));
    const envRefOnly = bridge.envRefs.every((ref) => /^[A-Z][A-Z0-9_]+$/.test(ref) && !secretLike(ref));
    const executableTemplateCount = bridge.commandTemplates.filter((template) => /\bre_[a-z0-9_]+\b|\bcurl\b|\bfrida\b|\bgdb\b|\bpython3\b|\bnode\b/.test(template)).length;
    const status = presentFallbacks.length > 0 ? "runtime-ready" : "blocked";
    return {
      bridgeId: bridge.id,
      title: bridge.title,
      status,
      domains: bridge.domains,
      preferredTools: bridge.preferredTools,
      fallbackTools: bridge.fallbackTools,
      presentPreferred,
      presentFallbacks,
      missingPreferred,
      fallback_available: presentFallbacks.length > 0,
      commandTemplates: bridge.commandTemplates,
      commandMarkersFound,
      commandMarkersMissing: bridge.commandTemplates.map((item) => item.split(":")[0]).filter((marker) => !commandMarkersFound.some((template) => template.startsWith(marker))),
      artifactPlan: bridge.artifactPlan,
      artifactPlanOk,
      envRefs: bridge.envRefs,
      envRefOnly,
      proofExit: bridge.proofExit,
      proofExitFound,
      proofExitMissing: bridge.proofExit.filter((marker) => !proofExitFound.includes(marker)),
      executableTemplateCount,
      narrativeOnly: executableTemplateCount === 0,
      nextRuntimeCommands: [
        "re_runtime_bridge refresh",
        `re_runtime_bridge show ${bridge.id}`,
        bridge.id === "web-cdp-replay" ? "re_live_browser run <url>" : undefined,
        bridge.id === "mobile-frida" ? "re_mobile_runtime run <package>" : undefined,
        bridge.id === "exploit-verifier-runtime" ? "re_exploit_lab run <target> 5" : undefined,
        "re_domain_proof_exit write <domain>",
      ].filter(Boolean),
    };
  });
  const fixtureBridgeIds = fixtureRows().map((row) => row.id ?? row.bridgeId).filter(Boolean);
  const closure = {
    allBridgeSpecsPresent: bridges.length === 4,
    allFallbacksAvailable: bridges.every((bridge) => bridge.fallback_available),
    allHaveExecutableTemplates: bridges.every((bridge) => !bridge.narrativeOnly && bridge.executableTemplateCount >= 3),
    allHaveArtifactPlans: bridges.every((bridge) => bridge.artifactPlanOk),
    allHaveProofExitMappings: bridges.every((bridge) => bridge.proofExit.length >= 5 && bridge.proofExitMissing.length === 0),
    allEnvRefsSecretFree: bridges.every((bridge) => bridge.envRefOnly),
    fixtureParity: BRIDGE_SPECS.every((bridge) => fixtureBridgeIds.includes(bridge.id)),
  };
  return {
    kind: "ProfessionalRuntimeBridgesGateV1",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ProfessionalRuntimeBridgesGateV1: true,
    runtime: "runtime:professional-runtime-bridges",
    requiredGates: REQUIRED_GATES,
    discovery,
    bridges,
    closure,
    nextRuntimeCommands: [
      "re_runtime_bridge show",
      "re_runtime_bridge refresh",
      "re_runtime_bridge show web-cdp-replay",
      "re_runtime_bridge show mobile-frida",
      "re_exploit_lab run <target> 5",
      "re_live_browser run <url>",
      "re_mobile_runtime run <package>",
    ],
    negativeCases: NEGATIVE_CASES.map((id) => ({ id, rejected: true })),
    invariants: [
      "professional_runtime_bridge_gate",
      "runtime_execution_bridge_matrix",
      "real_toolchain_bridge_contract",
      "exploit_verifier_runtime_contract",
      "web_cdp_replay_contract",
      "mobile_frida_dynamic_bridge_contract",
      "artifact_backed_tool_execution_plan",
      "env_ref_secret_boundary",
      "narrative_only_bridge_rejected",
    ],
  };
}

function validateReport(report) {
  const errors = [];
  if (report.kind !== "ProfessionalRuntimeBridgesGateV1") errors.push("kind_invalid");
  if (report.runtime !== "runtime:professional-runtime-bridges") errors.push("runtime_marker_missing");
  for (const gate of REQUIRED_GATES) if (!report.requiredGates?.includes(gate)) errors.push(`required_gate_missing:${gate}`);
  if (!Array.isArray(report.bridges) || report.bridges.length < 4) errors.push("bridge_count_too_low");
  for (const id of ["tool-bridge-runtime", "exploit-verifier-runtime", "web-cdp-replay", "mobile-frida"]) {
    if (!report.bridges?.some((bridge) => bridge.bridgeId === id)) errors.push(`bridge_missing:${id}`);
  }
  for (const bridge of report.bridges ?? []) {
    if (!bridge.fallback_available || !bridge.fallbackTools?.length) errors.push(`fallback_missing:${bridge.bridgeId}`);
    if (bridge.narrativeOnly || (bridge.executableTemplateCount ?? 0) < 3) errors.push(`narrative_only_bridge:${bridge.bridgeId}`);
    if (!bridge.artifactPlanOk || (bridge.artifactPlan?.length ?? 0) < 3) errors.push(`artifact_plan_missing:${bridge.bridgeId}`);
    if (!bridge.envRefOnly || bridge.envRefs?.some(secretLike)) errors.push(`env_ref_secret_boundary_failed:${bridge.bridgeId}`);
    if ((bridge.proofExit?.length ?? 0) < 5 || bridge.proofExitMissing?.length) errors.push(`proof_exit_mapping_missing:${bridge.bridgeId}`);
    if (!bridge.nextRuntimeCommands?.some((cmd) => String(cmd).includes("re_runtime_bridge"))) errors.push(`runtime_command_missing:${bridge.bridgeId}`);
  }
  for (const [key, value] of Object.entries(report.closure ?? {})) if (value !== true) errors.push(`closure_false:${key}`);
  return { ok: errors.length === 0, errors };
}

function mutateReport(report, id) {
  const clone = JSON.parse(JSON.stringify(report));
  if (id === "missing-fallback-template") { clone.bridges[0].fallback_available = false; clone.bridges[0].fallbackTools = []; clone.closure.allFallbacksAvailable = false; }
  if (id === "missing-proof-exit") { clone.bridges[1].proofExit = []; clone.bridges[1].proofExitMissing = ["multi-run verifier"]; clone.closure.allHaveProofExitMappings = false; }
  if (id === "literal-secret-in-env-ref") { clone.bridges[2].envRefs.push("sk-test-secret-literal"); clone.bridges[2].envRefOnly = false; clone.closure.allEnvRefsSecretFree = false; }
  if (id === "narrative-only-bridge") { clone.bridges[0].commandTemplates = ["tell operator to try harder"]; clone.bridges[0].executableTemplateCount = 0; clone.bridges[0].narrativeOnly = true; clone.closure.allHaveExecutableTemplates = false; }
  if (id === "missing-artifact-plan") { clone.bridges[3].artifactPlan = []; clone.bridges[3].artifactPlanOk = false; clone.closure.allHaveArtifactPlans = false; }
  if (id === "missing-web-cdp-contract") clone.bridges = clone.bridges.filter((bridge) => bridge.bridgeId !== "web-cdp-replay");
  if (id === "missing-mobile-frida-contract") clone.bridges = clone.bridges.filter((bridge) => bridge.bridgeId !== "mobile-frida");
  return clone;
}

function main() {
  const report = buildReport();
  const validation = validateReport(report);
  const checks = [
    check("runtime:professional-runtime-bridges", validation.ok, { validation, closure: report.closure }),
    check("runtime:bridge-fallbacks", report.closure.allFallbacksAvailable, { bridges: report.bridges.map((bridge) => ({ id: bridge.bridgeId, presentFallbacks: bridge.presentFallbacks })) }),
    check("runtime:bridge-executable-templates", report.closure.allHaveExecutableTemplates, { bridges: report.bridges.map((bridge) => ({ id: bridge.bridgeId, executableTemplateCount: bridge.executableTemplateCount })) }),
    check("runtime:bridge-artifact-plans", report.closure.allHaveArtifactPlans, { bridges: report.bridges.map((bridge) => ({ id: bridge.bridgeId, artifactPlan: bridge.artifactPlan })) }),
    check("runtime:bridge-proof-exits", report.closure.allHaveProofExitMappings, { missing: report.bridges.map((bridge) => ({ id: bridge.bridgeId, missing: bridge.proofExitMissing })) }),
    check("runtime:bridge-env-ref-secret-boundary", report.closure.allEnvRefsSecretFree, { envRefs: report.bridges.map((bridge) => ({ id: bridge.bridgeId, envRefs: bridge.envRefs })) }),
    markerRow("code:professional-runtime-bridges", "packages/coding-agent/src/core/recon-profile.ts", ["ProfessionalRuntimeBridgesGateV1", "PROFESSIONAL_RUNTIME_BRIDGE_MATRIX", "buildProfessionalRuntimeBridgesGate", "formatProfessionalRuntimeBridgesGate", "re_runtime_bridge", "runtime:professional-runtime-bridges", "bridge-rev-ghidra-r2-angr", "verifier-pwn-crash-offset-primitive-exploit", "cdp-network-capture", "mobile-frida-java-hook-template"]),
    markerRow("profile:professional-runtime-bridges", "repi-profile/extensions/reverse-pentest-core.ts", ["ProfessionalRuntimeBridgesGateV1", "PROFESSIONAL_RUNTIME_BRIDGE_MATRIX", "buildProfessionalRuntimeBridgesGate", "formatProfessionalRuntimeBridgesGate", "re_runtime_bridge", "runtime:professional-runtime-bridges"]),
    markerRow("test:professional-runtime-bridges", "packages/coding-agent/test/recon-profile.test.ts", ["re_runtime_bridge", "re-runtime-bridge", "ProfessionalRuntimeBridgesGateV1"]),
    markerRow("npm:professional-runtime-bridges", "package.json", ["gate:professional-runtime-bridges", "professional-runtime-bridges-gate.mjs"]),
    markerRow("harness:professional-runtime-bridges", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:professional-runtime-bridges", "ProfessionalRuntimeBridgesGateV1", "child:gate:professional-runtime-bridges"]),
    markerRow("autonomy:professional-runtime-bridges", "scripts/reverse-agent/autonomy-control-plane.mjs", ["ProfessionalRuntimeBridgesGateV1", "professional_runtime_bridge_gate", "runtime_execution_bridge_matrix"]),
    markerRow("schema:professional-runtime-bridges", SCHEMA_PATH, ["ProfessionalRuntimeBridgesGateV1", "professional_runtime_bridge_gate", "web_cdp_replay_contract", "mobile_frida_dynamic_bridge_contract"]),
    markerRow("fixture:professional-runtime-bridges", FIXTURE_PATH, ["ProfessionalRuntimeBridgesGateV1", "tool-bridge-runtime", "exploit-verifier-runtime", "web-cdp-replay", "mobile-frida", "narrative-only-bridge"]),
    markerRow("docs:professional-runtime-bridges-readme", "README.md", ["ProfessionalRuntimeBridgesGateV1", "re_runtime_bridge", "gate:professional-runtime-bridges", "Web/CDP replay", "Frida/Mobile"]),
    markerRow("docs:professional-runtime-bridges-reverse-agent", "docs/reverse-agent/README.md", ["ProfessionalRuntimeBridgesGateV1", "runtime_execution_bridge_matrix", "re_runtime_bridge"]),
    markerRow("docs:professional-runtime-bridges-recon", "packages/coding-agent/docs/recon.md", ["ProfessionalRuntimeBridgesGateV1", "re_runtime_bridge", "professional_runtime_bridge_gate"]),
  ];
  const negatives = NEGATIVE_CASES.map((id) => {
    const result = validateReport(mutateReport(report, id));
    return { id, rejected: !result.ok, errors: result.errors };
  });
  checks.push(check("negative:professional-runtime-bridges", negatives.every((row) => row.rejected), { negatives }));
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { ...report, ok: failed.length === 0, root, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "professional-runtime-bridges", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI Professional Runtime Bridges Gate");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length} bridges=${report.bridges.length}`);
  }
  if (strict && failed.length) process.exitCode = 1;
}

main();
