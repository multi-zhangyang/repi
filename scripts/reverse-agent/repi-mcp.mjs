#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const root = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : process.cwd();
const argv = process.argv.slice(process.argv[2] && !process.argv[2].startsWith("-") ? 3 : 2);
const command = argv[0] ?? "status";
const json = argv.includes("--json");
const agentDir = process.env.REPI_CODING_AGENT_DIR || process.env.REPI_AGENT_DIR || join(homedir(), ".repi", "agent");
const cwd = process.cwd();

function usage() {
	return `REPI MCP manager

Usage:
  repi mcp status [--json]
  repi mcp list [--json]
  repi mcp probe <server-id> [--json]
  repi mcp call <server-id> <tool-name> [json-args] [--json]
  repi mcp prompts <server-id> [--json]
  repi mcp get-prompt <server-id> <prompt-name> [json-args] [--json]

Config files:
  ~/.repi/agent/mcp.json
  <cwd>/.repi/mcp.json

Example ~/.repi/agent/mcp.json:
{
  "mcpServers": {
    "demo": { "transport": "stdio", "command": "node", "args": ["/path/server.js"], "autoRegisterTools": true },
    "remote": { "transport": "http", "url": "https://mcp.example.com/mcp", "headers": { "Authorization": "Bearer $MCP_API_KEY" }, "autoRegisterTools": true }
  }
}
`;
}

function redact(text) {
	return String(text ?? "")
		.replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "<redacted:api-key>")
		.replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/(API_KEY|AUTH_TOKEN|TOKEN|SECRET|PASSWORD)=([^\s]+)/gi, "$1=<redacted>");
}
function readJson(path) {
	if (!existsSync(path)) return undefined;
	try { return JSON.parse(readFileSync(path, "utf8")); } catch { return undefined; }
}
function redactConfig(cfg) {
	const out = { ...cfg };
	if (out.env) out.env = Object.fromEntries(Object.entries(out.env).map(([k, v]) => [k, String(v).startsWith("$") ? v : "<redacted>"]));
	if (out.headers) out.headers = Object.fromEntries(Object.entries(out.headers).map(([k, v]) => [k, String(v).startsWith("$") ? v : "<redacted>"]));
	if (out.bearerToken) out.bearerToken = String(out.bearerToken).startsWith("$") ? out.bearerToken : "<redacted>";
	return out;
}
function redactServers(servers) { return servers.map(s => ({ ...s, config: redactConfig(s.config) })); }
function configPaths() { return [join(agentDir, "mcp.json"), join(cwd, ".repi", "mcp.json")]; }
function loadServers() {
	const map = new Map();
	for (const sourcePath of configPaths()) {
		const parsed = readJson(sourcePath);
		if (!parsed) continue;
		const servers = parsed.mcpServers || parsed.servers || {};
		for (const [id, cfg] of Object.entries(servers)) map.set(id, { id, config: { transport: cfg.url ? "http" : "stdio", ...cfg }, sourcePath });
	}
	return [...map.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function envValue(value) { return String(value).startsWith("$") ? (process.env[String(value).slice(1)] || "") : String(value); }
function envMap(env) { const out = { ...process.env }; for (const [k,v] of Object.entries(env || {})) out[k] = envValue(v); return out; }
function headerValue(value) { return envValue(value).replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name) => process.env[name] || ""); }
function headerMap(cfg, sessionId, protocolVersion = "2025-11-25") {
	const headers = { ...(cfg.headers || {}), Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": protocolVersion };
	for (const [k, v] of Object.entries(headers)) headers[k] = headerValue(v);
	if (cfg.bearerToken && !Object.keys(headers).some(k => k.toLowerCase() === "authorization")) headers.Authorization = `Bearer ${envValue(cfg.bearerToken)}`;
	if (sessionId) headers["Mcp-Session-Id"] = sessionId;
	return headers;
}
function parseSseJsonMessages(text) {
	const messages = [];
	for (const rawEvent of String(text || "").split(/\r?\n\r?\n/)) {
		const data = rawEvent.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n").trim();
		if (!data || data === "[DONE]") continue;
		try { messages.push(JSON.parse(data)); } catch {}
	}
	return messages;
}
async function httpJsonRpcPost(entry, state, message, expectId) {
	const cfg = entry.config;
	if (!cfg.url) throw new Error("missing_url");
	const timeoutMs = cfg.timeoutMs || 10000;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(new Error("MCP HTTP request timeout")), timeoutMs);
	try {
		const response = await fetch(cfg.url, { method: "POST", headers: headerMap(cfg, state.sessionId, state.protocolVersion), body: JSON.stringify(message), signal: controller.signal });
		const sessionId = response.headers.get("mcp-session-id");
		if (sessionId) state.sessionId = sessionId;
		const bodyText = await response.text();
		if (!response.ok) throw new Error(`MCP HTTP ${response.status}${bodyText ? `: ${redact(bodyText).slice(0,1000)}` : ""}`);
		if (!expectId) return undefined;
		const contentType = response.headers.get("content-type") || "";
		let messages = [];
		if (contentType.includes("text/event-stream")) messages = parseSseJsonMessages(bodyText);
		else {
			try {
				const parsed = JSON.parse(bodyText);
				messages = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				messages = parseSseJsonMessages(bodyText);
			}
		}
		const msg = messages.find(item => item?.id === expectId) || messages.find(item => item?.id !== undefined);
		if (!msg) throw new Error("MCP HTTP response did not contain a JSON-RPC result");
		if (msg.error) throw new Error(redact(JSON.stringify(msg.error)));
		return msg.result || {};
	} finally {
		clearTimeout(timer);
	}
}
async function httpMcpRequest(entry, method, params, mapResult) {
	const cfg = entry.config;
	if (cfg.disabled) return { serverId: entry.id, ok: false, transport: "http", url: cfg.url, error: "server_disabled" };
	if (!cfg.url) return { serverId: entry.id, ok: false, transport: "http", error: "missing_url" };
	const state = { sessionId: undefined, protocolVersion: "2025-11-25" };
	try {
		const init = await httpJsonRpcPost(entry, state, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "repi", version: "cli" } } }, 1);
		if (typeof init?.protocolVersion === "string") state.protocolVersion = init.protocolVersion;
		await httpJsonRpcPost(entry, state, { jsonrpc: "2.0", method: "notifications/initialized" });
		const raw = await httpJsonRpcPost(entry, state, { jsonrpc: "2.0", id: 2, method, params: params || {} }, 2);
		return mapResult(raw || {}, entry, init || {});
	} catch (error) {
		return { serverId: entry.id, ok: false, transport: "http", url: cfg.url, error: redact(error.message || String(error)) };
	}
}
function writeLine(child, msg) { child.stdin.write(`${JSON.stringify(msg)}\n`, "utf8"); }
function toolAllowed(cfg, toolName) {
	const allowed = new Set(cfg.allowedTools || []);
	const blocked = new Set(cfg.blockedTools || []);
	return (allowed.size === 0 || allowed.has(toolName)) && !blocked.has(toolName);
}
function parseJsonArgs(raw) {
	if (!raw || raw === "--json") return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch (error) {
		throw new Error(`invalid_json_args: ${error.message}`);
	}
}
function normalizeCallContent(result) {
	const content = Array.isArray(result?.content) ? result.content : [];
	const normalized = [];
	for (const item of content) {
		if (item?.type === "text" && typeof item.text === "string") {
			normalized.push({ type: "text", text: redact(item.text) });
		} else if (item?.type === "image" && typeof item.data === "string" && typeof item.mimeType === "string") {
			normalized.push({ type: "image", data: item.data, mimeType: item.mimeType });
		} else if (item) {
			normalized.push({ type: "text", text: redact(JSON.stringify(item)) });
		}
	}
	if (!normalized.length) normalized.push({ type: "text", text: "MCP tool returned no content." });
	return normalized;
}
function normalizePromptGet(result, promptName) {
	const lines = [`prompt=${promptName}`];
	if (typeof result?.description === "string") lines.push(`description=${redact(result.description)}`);
	const messages = Array.isArray(result?.messages) ? result.messages : [];
	for (const [index, message] of messages.entries()) {
		const role = typeof message?.role === "string" ? message.role : "unknown";
		const content = message?.content;
		if (content?.type === "text" && typeof content.text === "string") {
			lines.push(`\n[${index}] role=${role}\n${redact(content.text)}`);
		} else if (content?.type === "image") {
			lines.push(`\n[${index}] role=${role}\n[image:${content.mimeType || "unknown"}]`);
		} else {
			lines.push(`\n[${index}] role=${role}\n${redact(JSON.stringify(content ?? message))}`);
		}
	}
	return lines.join("\n");
}
function simpleMcpRequest(entry, method, params, mapResult) {
	if ((entry.config.transport || "stdio") === "http") return httpMcpRequest(entry, method, params, mapResult);
	return new Promise((resolveRequest) => {
		const cfg = entry.config;
		if (cfg.disabled) return resolveRequest({ serverId: entry.id, ok: false, transport: cfg.transport || "stdio", error: "server_disabled" });
		if (!cfg.command) return resolveRequest({ serverId: entry.id, ok: false, transport: "stdio", error: "missing_command" });
		const timeoutMs = cfg.timeoutMs || 10000;
		const child = spawn(cfg.command, cfg.args || [], { cwd: cfg.cwd ? resolve(cfg.cwd) : root, env: envMap(cfg.env), stdio: ["pipe", "pipe", "pipe"] });
		let buffer = ""; let stderr = ""; let stage = "init"; let done = false; let id = 1;
		function finish(result) { if (done) return; done = true; clearTimeout(timer); try { child.kill("SIGTERM"); } catch {} resolveRequest({ ...result, stderrTail: stderr.slice(-1000) }); }
		function req(reqMethod, reqParams) { const rid = id++; writeLine(child, { jsonrpc: "2.0", id: rid, method: reqMethod, ...(reqParams ? { params: reqParams } : {}) }); return rid; }
		const timer = setTimeout(() => finish({ serverId: entry.id, ok: false, transport: "stdio", error: `timeout_${stage}` }), timeoutMs);
		child.stderr.on("data", c => { stderr += redact(String(c)); if (stderr.length > 4000) stderr = stderr.slice(-4000); });
		child.on("error", e => finish({ serverId: entry.id, ok: false, transport: "stdio", error: redact(e.message) }));
		child.on("close", (code, signal) => { if (!done) finish({ serverId: entry.id, ok: false, transport: "stdio", error: `server_exited code=${code} signal=${signal}` }); });
		child.stdout.on("data", chunk => {
			buffer += String(chunk);
			while (buffer.includes("\n")) {
				const idx = buffer.indexOf("\n"); const line = buffer.slice(0, idx).trim(); buffer = buffer.slice(idx + 1);
				if (!line) continue;
				let msg; try { msg = JSON.parse(line); } catch { continue; }
				if (msg.error) return finish({ serverId: entry.id, ok: false, transport: "stdio", error: redact(JSON.stringify(msg.error)) });
				if (stage === "init" && msg.id === 1) { stage = method; writeLine(child, { jsonrpc: "2.0", method: "notifications/initialized" }); req(method, params || {}); continue; }
				if (stage === method && msg.id === 2) return finish(mapResult(msg.result || {}, entry));
			}
		});
		req("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "repi", version: "cli" } });
	});
}
function probe(entry) {
	if ((entry.config.transport || "stdio") === "http") {
		return httpMcpRequest(entry, "tools/list", {}, (raw, selected, init) => ({
			serverId: selected.id,
			ok: true,
			transport: "http",
			url: selected.config.url,
			protocolVersion: init.protocolVersion || "2025-11-25",
			tools: Array.isArray(raw.tools) ? raw.tools.map(t => ({ name: t.name, description: t.description })).filter(t => t.name && toolAllowed(selected.config, t.name)) : [],
		}));
	}
	return new Promise((resolveProbe) => {
		const cfg = entry.config;
		if (cfg.disabled) return resolveProbe({ serverId: entry.id, ok: false, transport: cfg.transport || "stdio", tools: [], error: "server_disabled" });
		if (!cfg.command) return resolveProbe({ serverId: entry.id, ok: false, transport: "stdio", tools: [], error: "missing_command" });
		const timeoutMs = cfg.timeoutMs || 10000;
		const child = spawn(cfg.command, cfg.args || [], { cwd: cfg.cwd ? resolve(cfg.cwd) : root, env: envMap(cfg.env), stdio: ["pipe", "pipe", "pipe"] });
		let buffer = ""; let stderr = ""; let stage = "init"; let done = false; const pending = new Map(); let id = 1;
		function finish(result) { if (done) return; done = true; clearTimeout(timer); try { child.kill("SIGTERM"); } catch {} resolveProbe({ ...result, stderrTail: stderr.slice(-1000) }); }
		function req(method, params) { const rid = id++; writeLine(child, { jsonrpc: "2.0", id: rid, method, ...(params ? { params } : {}) }); return rid; }
		const timer = setTimeout(() => finish({ serverId: entry.id, ok: false, transport: "stdio", tools: [], error: `timeout_${stage}` }), timeoutMs);
		child.stderr.on("data", c => { stderr += redact(String(c)); if (stderr.length > 4000) stderr = stderr.slice(-4000); });
		child.on("error", e => finish({ serverId: entry.id, ok: false, transport: "stdio", tools: [], error: redact(e.message) }));
		child.on("close", (code, signal) => { if (!done) finish({ serverId: entry.id, ok: false, transport: "stdio", tools: [], error: `server_exited code=${code} signal=${signal}` }); });
		child.stdout.on("data", chunk => {
			buffer += String(chunk);
			while (buffer.includes("\n")) {
				const idx = buffer.indexOf("\n"); const line = buffer.slice(0, idx).trim(); buffer = buffer.slice(idx + 1);
				if (!line) continue;
				let msg; try { msg = JSON.parse(line); } catch { continue; }
				if (msg.error) return finish({ serverId: entry.id, ok: false, transport: "stdio", tools: [], error: redact(JSON.stringify(msg.error)) });
				if (stage === "init" && msg.id === 1) { stage = "tools"; writeLine(child, { jsonrpc: "2.0", method: "notifications/initialized" }); req("tools/list", {}); continue; }
				if (stage === "tools" && msg.id === 2) {
					const tools = Array.isArray(msg.result?.tools) ? msg.result.tools
						.map(t => ({ name: t.name, description: t.description }))
						.filter(t => t.name && toolAllowed(cfg, t.name)) : [];
					return finish({ serverId: entry.id, ok: true, transport: "stdio", protocolVersion: "2025-11-25", tools });
				}
			}
		});
		req("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "repi", version: "cli" } });
	});
}
function callTool(entry, toolName, args) {
	if ((entry.config.transport || "stdio") === "http") {
		if (!toolAllowed(entry.config, toolName)) return Promise.resolve({ serverId: entry.id, toolName, ok: false, transport: "http", url: entry.config.url, error: "tool_not_allowed" });
		return httpMcpRequest(entry, "tools/call", { name: toolName, arguments: args || {} }, (raw, selected) => ({
			serverId: selected.id,
			toolName,
			ok: !raw?.isError,
			transport: "http",
			url: selected.config.url,
			isError: raw?.isError === true,
			content: normalizeCallContent(raw),
		}));
	}
	return new Promise((resolveCall) => {
		const cfg = entry.config;
		if (cfg.disabled) return resolveCall({ serverId: entry.id, toolName, ok: false, transport: cfg.transport || "stdio", error: "server_disabled" });
		if (!cfg.command) return resolveCall({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: "missing_command" });
		if (!toolAllowed(cfg, toolName)) return resolveCall({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: "tool_not_allowed" });
		const timeoutMs = cfg.timeoutMs || 10000;
		const child = spawn(cfg.command, cfg.args || [], { cwd: cfg.cwd ? resolve(cfg.cwd) : root, env: envMap(cfg.env), stdio: ["pipe", "pipe", "pipe"] });
		let buffer = ""; let stderr = ""; let stage = "init"; let done = false; let id = 1;
		function finish(result) { if (done) return; done = true; clearTimeout(timer); try { child.kill("SIGTERM"); } catch {} resolveCall({ ...result, stderrTail: stderr.slice(-1000) }); }
		function req(method, params) { const rid = id++; writeLine(child, { jsonrpc: "2.0", id: rid, method, ...(params ? { params } : {}) }); return rid; }
		const timer = setTimeout(() => finish({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: `timeout_${stage}` }), timeoutMs);
		child.stderr.on("data", c => { stderr += redact(String(c)); if (stderr.length > 4000) stderr = stderr.slice(-4000); });
		child.on("error", e => finish({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: redact(e.message) }));
		child.on("close", (code, signal) => { if (!done) finish({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: `server_exited code=${code} signal=${signal}` }); });
		child.stdout.on("data", chunk => {
			buffer += String(chunk);
			while (buffer.includes("\n")) {
				const idx = buffer.indexOf("\n"); const line = buffer.slice(0, idx).trim(); buffer = buffer.slice(idx + 1);
				if (!line) continue;
				let msg; try { msg = JSON.parse(line); } catch { continue; }
				if (msg.error) return finish({ serverId: entry.id, toolName, ok: false, transport: "stdio", error: redact(JSON.stringify(msg.error)) });
				if (stage === "init" && msg.id === 1) { stage = "call"; writeLine(child, { jsonrpc: "2.0", method: "notifications/initialized" }); req("tools/call", { name: toolName, arguments: args || {} }); continue; }
				if (stage === "call" && msg.id === 2) {
					return finish({ serverId: entry.id, toolName, ok: !msg.result?.isError, transport: "stdio", isError: msg.result?.isError === true, content: normalizeCallContent(msg.result) });
				}
			}
		});
		req("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "repi", version: "cli" } });
	});
}
function textStatus(servers) {
	const lines = ["MCP servers:", `config_paths: ${configPaths().join(", ")}`];
	if (!servers.length) lines.push("- none");
	for (const s of servers) lines.push(`- ${s.id} [${s.config.transport || "stdio"}${s.config.disabled ? ", disabled" : ""}${s.config.autoRegisterTools || s.config.enableTools ? ", tools:auto" : ""}] source=${s.sourcePath}`);
	return lines.join("\n");
}
function textProbe(results) {
	const lines = ["MCP probe results:"];
	for (const r of results) {
		lines.push(`- ${r.serverId} [${r.ok ? "ok" : "fail"}] tools=${r.tools?.length || 0}${r.error ? ` error=${r.error}` : ""}`);
		for (const t of (r.tools || []).slice(0,20)) lines.push(`  tool: ${t.name}${t.description ? ` — ${t.description}` : ""}`);
	}
	return lines.join("\n");
}
function textCall(result) {
	const lines = [`MCP call: ${result.serverId}/${result.toolName} [${result.ok ? "ok" : "fail"}]`];
	if (result.error) lines.push(`error=${result.error}`);
	for (const item of result.content || []) {
		if (item.type === "text") lines.push(item.text);
		else lines.push(`[${item.type}:${item.mimeType || "unknown"}]`);
	}
	if (result.stderrTail) lines.push(`stderr_tail=${result.stderrTail.replace(/\s+/g, " ").slice(-500)}`);
	return lines.join("\n");
}
function textPrompts(result) {
	const lines = [`MCP prompts: ${result.serverId} [${result.ok ? "ok" : "fail"}]`];
	if (result.error) lines.push(`error=${result.error}`);
	for (const prompt of result.prompts || []) {
		lines.push(`- ${prompt.name}${prompt.description ? ` — ${prompt.description}` : ""}`);
		if (prompt.arguments) lines.push(`  arguments=${JSON.stringify(prompt.arguments)}`);
	}
	if (result.stderrTail) lines.push(`stderr_tail=${result.stderrTail.replace(/\s+/g, " ").slice(-500)}`);
	return lines.join("\n");
}
function textPrompt(result) {
	const lines = [`MCP prompt: ${result.serverId}/${result.name} [${result.ok ? "ok" : "fail"}]`];
	if (result.error) lines.push(`error=${result.error}`);
	if (result.text) lines.push(result.text);
	if (result.stderrTail) lines.push(`stderr_tail=${result.stderrTail.replace(/\s+/g, " ").slice(-500)}`);
	return lines.join("\n");
}

if (["--help", "-h", "help"].includes(command)) { console.log(usage()); process.exit(0); }
const servers = loadServers();
if (["status", "config"].includes(command)) {
	const report = { kind: "repi-mcp-status", ok: true, configPaths: configPaths(), servers: redactServers(servers) };
	console.log(json ? JSON.stringify(report, null, 2) : textStatus(servers));
	process.exit(0);
}
if (command === "call") {
	const target = argv[1];
	const toolName = argv[2];
	if (!target || !toolName) { console.error(usage()); process.exit(2); }
	let args;
	try { args = parseJsonArgs(argv[3]); } catch (error) { console.error(error.message); process.exit(2); }
	const selected = servers.find(s => s.id === target || s.id.startsWith(target));
	const result = selected ? await callTool(selected, toolName, args) : { serverId: target, toolName, ok: false, transport: "stdio", error: "server_not_found" };
	console.log(json ? JSON.stringify(result, null, 2) : textCall(result));
	process.exit(result.ok ? 0 : 1);
}
if (command === "prompts") {
	const target = argv[1];
	if (!target) { console.error(usage()); process.exit(2); }
	const selected = servers.find(s => s.id === target || s.id.startsWith(target));
	const result = selected ? await simpleMcpRequest(selected, "prompts/list", {}, (raw, entry) => ({
		serverId: entry.id,
		ok: true,
		transport: entry.config.transport || "stdio",
		url: entry.config.transport === "http" ? entry.config.url : undefined,
		prompts: Array.isArray(raw.prompts) ? raw.prompts.filter(p => typeof p?.name === "string").map(p => ({ name: p.name, description: p.description, arguments: p.arguments })) : [],
	})) : { serverId: target, ok: false, transport: "stdio", prompts: [], error: "server_not_found" };
	console.log(json ? JSON.stringify(result, null, 2) : textPrompts(result));
	process.exit(result.ok ? 0 : 1);
}
if (command === "get-prompt" || command === "prompt") {
	const target = argv[1];
	const name = argv[2];
	if (!target || !name) { console.error(usage()); process.exit(2); }
	let args;
	try { args = parseJsonArgs(argv[3]); } catch (error) { console.error(error.message); process.exit(2); }
	const selected = servers.find(s => s.id === target || s.id.startsWith(target));
	const result = selected ? await simpleMcpRequest(selected, "prompts/get", { name, arguments: args || {} }, (raw, entry) => ({
		serverId: entry.id,
		name,
		ok: true,
		transport: entry.config.transport || "stdio",
		url: entry.config.transport === "http" ? entry.config.url : undefined,
		text: normalizePromptGet(raw, name),
	})) : { serverId: target, name, ok: false, transport: "stdio", error: "server_not_found" };
	console.log(json ? JSON.stringify(result, null, 2) : textPrompt(result));
	process.exit(result.ok ? 0 : 1);
}
if (["list", "probe", "tools"].includes(command)) {
	const target = command === "probe" ? argv[1] : undefined;
	const selected = target ? servers.filter(s => s.id === target || s.id.startsWith(target)) : servers.filter(s => !s.config.disabled);
	const results = [];
	for (const server of selected) results.push(await probe(server));
	const report = { kind: "repi-mcp-probe", ok: results.every(r => r.ok), results };
	console.log(json ? JSON.stringify(report, null, 2) : textProbe(results));
	process.exit(report.ok ? 0 : 1);
}
console.error(usage());
process.exit(2);
