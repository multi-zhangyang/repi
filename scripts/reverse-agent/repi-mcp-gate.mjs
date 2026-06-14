#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const root = resolve(argv.find((arg) => !arg.startsWith("-")) ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_MCP_GATE_TMP === "1";
const tempRoot = mkdtempSync(join(tmpdir(), "repi-mcp-gate-"));
const checks = [];

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function check(id, status, evidence = {}) { checks.push({ id, status, evidence }); }
function read(path) { return readFileSync(join(root, path), "utf8"); }
function markerCheck(id, path, required) {
  const text = existsSync(join(root, path)) ? read(path) : "";
  const missing = required.filter((marker) => !text.includes(marker));
  check(id, missing.length === 0 ? "pass" : "fail", { path, sha256: text ? sha256(text).slice(0, 16) : null, missing });
}
function redact(text) {
  return String(text ?? "")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "<redacted:api-key>")
    .replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>");
}
function run(args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [join(root, "scripts/reverse-agent/repi-mcp.mjs"), root, ...args], {
      cwd: options.cwd ?? tempRoot,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = ""; let stderr = "";
    const timeout = setTimeout(() => { child.kill("SIGTERM"); }, options.timeoutMs ?? 10000);
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      resolveRun({ code, signal, stdout: redact(stdout), stderr: redact(stderr), combined: redact(`${stdout}\n${stderr}`) });
    });
  });
}
function assertRun(id, run, includes = []) {
  const missing = includes.filter((needle) => !run.combined.includes(needle));
  check(id, run.code === 0 && missing.length === 0 ? "pass" : "fail", { code: run.code, missing, stdoutTail: run.stdout.slice(-1200), stderrTail: run.stderr.slice(-1200) });
}

async function stdioScenario() {
  const dir = join(tempRoot, "stdio"); mkdirSync(join(dir, ".repi"), { recursive: true });
  const serverPath = join(dir, "fake-mcp.mjs");
  writeFileSync(serverPath, `import readline from 'node:readline';\nconst rl=readline.createInterface({input:process.stdin});\nrl.on('line', line=>{const msg=JSON.parse(line);\n if(msg.method==='initialize') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{protocolVersion:'2025-11-25', capabilities:{tools:{},resources:{},prompts:{}}}}));\n if(msg.method==='tools/list') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{tools:[{name:'echo',description:'Echo tool',inputSchema:{type:'object'}}]}}));\n if(msg.method==='tools/call') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{content:[{type:'text',text:'echo '+msg.params.arguments.text}],isError:false}}));\n if(msg.method==='resources/list') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{resources:[{uri:'file:///demo.txt',name:'demo',mimeType:'text/plain'}]}}));\n if(msg.method==='resources/read') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{contents:[{uri:msg.params.uri,mimeType:'text/plain',text:'resource token=synthetic-redaction-value'}]}}));\n if(msg.method==='prompts/list') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{prompts:[{name:'triage',description:'Triage'}]}}));\n if(msg.method==='prompts/get') console.log(JSON.stringify({jsonrpc:'2.0', id:msg.id, result:{messages:[{role:'user',content:{type:'text',text:'triage '+msg.params.arguments.target+' token=synthetic-redaction-value'}}]}}));\n});\n`, "utf8");
  writeFileSync(join(dir, ".repi", "mcp.json"), JSON.stringify({ mcpServers: { fake: { transport: "stdio", command: process.execPath, args: [serverPath], autoRegisterTools: true, deferToolSchemas: true } } }), "utf8");
  assertRun("stdio:probe", await run(["probe", "fake"], { cwd: dir }), ["tool: echo"]);
  assertRun("stdio:search", await run(["search", "fake", "echo"], { cwd: dir }), ["MCP tool search", "echo"]);
  assertRun("stdio:call", await run(["call", "fake", "echo", '{"text":"hi"}'], { cwd: dir }), ["echo hi"]);
  const resource = await run(["read-resource", "fake", "file:///demo.txt"], { cwd: dir });
  assertRun("stdio:resource-redaction", resource, ["resource token=<redacted>"]);
  const prompt = await run(["get-prompt", "fake", "triage", '{"target":"example.test"}'], { cwd: dir });
  assertRun("stdio:prompt-redaction", prompt, ["triage example.test token=<redacted>"]);
}

async function httpScenario() {
  const dir = join(tempRoot, "http"); mkdirSync(join(dir, ".repi"), { recursive: true });
  let initCount = 0; let session = ""; let injectedFailure = false;
  const server = createServer((req, res) => {
    if (req.method === "GET" && req.url === "/.well-known/oauth-protected-resource") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ resource: `http://${req.headers.host}/mcp`, authorization_servers: [`http://${req.headers.host}/.well-known/oauth-authorization-server`] })); return;
    }
    let body = ""; req.setEncoding("utf8"); req.on("data", (chunk) => { body += chunk; }); req.on("end", () => {
      const msg = body ? JSON.parse(body) : {};
      if (req.method === "DELETE") { res.writeHead(202).end(); return; }
      if (req.headers.authorization !== "Bearer gate-token") { res.writeHead(401, { "www-authenticate": `Bearer resource_metadata="http://${req.headers.host}/.well-known/oauth-protected-resource"` }).end("bad auth"); return; }
      if (msg.method === "initialize") { session = `s-${++initCount}`; res.writeHead(200, { "content-type": "application/json", "mcp-session-id": session }).end(JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ protocolVersion:"2025-11-25", capabilities:{ tools:{}, resources:{}, prompts:{} } } })); return; }
      if (msg.method !== "initialize" && req.headers["mcp-session-id"] !== session) { res.writeHead(404).end("stale session"); return; }
      if (msg.method === "notifications/initialized") { res.writeHead(202).end(); return; }
      if (msg.method === "tools/list") { res.writeHead(200, { "content-type":"text/event-stream" }).end(`data: ${JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ tools:[{ name:"echo", description:"Echo tool", inputSchema:{ type:"object" } }] } })}\n\n`); return; }
      if (msg.method === "tools/call" && msg.params.arguments.text === "reconnect" && !injectedFailure) { injectedFailure = true; res.writeHead(503).end("retry me"); return; }
      if (msg.method === "tools/call") { res.writeHead(200, { "content-type":"application/json" }).end(JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ content:[{type:"text",text:`http ${msg.params.arguments.text}`}], isError:false } })); return; }
      if (msg.method === "resources/list") { res.writeHead(200, { "content-type":"application/json" }).end(JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ resources:[{uri:"file:///demo.txt", name:"demo"}] } })); return; }
      if (msg.method === "resources/read") { res.writeHead(200, { "content-type":"application/json" }).end(JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ contents:[{uri:msg.params.uri, mimeType:"text/plain", text:"http-resource"}] } })); return; }
      if (msg.method === "prompts/list") { res.writeHead(200, { "content-type":"application/json" }).end(JSON.stringify({ jsonrpc:"2.0", id:msg.id, result:{ prompts:[{name:"triage"}] } })); return; }
      res.writeHead(404).end("unknown");
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    writeFileSync(join(dir, ".repi", "mcp.json"), JSON.stringify({ mcpServers: { httpfake: { transport:"http", url:`http://127.0.0.1:${port}/mcp`, headers:{ Authorization:"Bearer $MCP_GATE_TOKEN" }, autoRegisterTools:true, deferToolSchemas:true, poolIdleMs:5000 } } }), "utf8");
    const env = { MCP_GATE_TOKEN: "gate-token" };
    assertRun("http:auth-info", await run(["auth-info", "httpfake"], { cwd: dir }), ["resourceMetadataUrl", "authorization_servers"]);
    assertRun("http:probe", await run(["probe", "httpfake"], { cwd: dir, env }), ["tool: echo"]);
    assertRun("http:resources", await run(["resources", "httpfake"], { cwd: dir, env }), ["file:///demo.txt"]);
    assertRun("http:reconnect-cli", await run(["call", "httpfake", "echo", '{"text":"reconnect"}'], { cwd: dir, env }), ["http reconnect"]);
  } finally { await new Promise((resolve) => server.close(() => resolve())); }
}

async function main() {
  markerCheck("code:mcp-pool-reconnect", "packages/coding-agent/src/core/mcp-manager.ts", ["clientPool", "isRetryableMcpError", "poolIdleMs", "REPI_MCP_ALLOWED_SERVERS", "REPI_MCP_ALLOWED_TOOLS"]);
  markerCheck("code:mcp-resource-mention", "packages/coding-agent/src/core/agent-session.ts", ["_expandMcpResourceMentions", "@mcp/", "<mcp-resource"]);
  markerCheck("code:subagent-mcp-inherit", "packages/coding-agent/src/core/agent-thread-manager.ts", ["mcpInherited", "prepareWorkerMcp", "REPI_MCP_ALLOWED_SERVERS", "REPI_MCP_ALLOWED_TOOLS"]);
  markerCheck("docs:mcp-readme", "README.md", ["deferToolSchemas", "repi mcp search", "repi mcp read-resource", "@mcp/<server>/<uri>", "gate:repi-mcp"]);
  markerCheck("npm:mcp-gate", "package.json", ["gate:repi-mcp", "repi-mcp-gate.mjs"]);
  await stdioScenario();
  await httpScenario();
  const failed = checks.filter((item) => item.status !== "pass");
  const report = { kind: "repi-mcp-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, tempRoot, checks };
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log("REPI MCP Gate");
    for (const item of checks) console.log(`${item.status === "pass" ? "PASS" : "FAIL"} ${item.id}`);
    console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
  }
  if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
  if (strict && !report.ok) process.exit(1);
}

main().catch((error) => {
  check("gate:exception", "fail", { error: redact(error?.stack || error?.message || String(error)) });
  const report = { kind: "repi-mcp-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: false, root, tempRoot, checks };
  console.log(json ? JSON.stringify(report, null, 2) : `REPI MCP Gate\nFAIL gate:exception\n${redact(error?.stack || error?.message || String(error))}`);
  if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
});
