#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const root = resolve(argv.find((arg) => !arg.startsWith("-")) ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_JSHOOK_MCP_LIVE_TMP === "1";
const live = process.env.REPI_JSHOOK_MCP_LIVE === "1";
const browserLive = process.env.REPI_JSHOOK_BROWSER_LIVE === "1";
const tempRoot = mkdtempSync(join(tmpdir(), "repi-jshook-mcp-live-"));
const checks = [];

function check(id, status, evidence = {}) {
	checks.push({ id, status, evidence });
}
function sha256(value) {
	return createHash("sha256").update(value).digest("hex").slice(0, 16);
}
function redact(text) {
	return String(text ?? "")
		.replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, "<redacted:api-key>")
		.replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\bcfut_[A-Za-z0-9_-]{16,}\b/g, "<redacted:cloudflare-token>")
		.replace(/(Authorization\s*[:=]\s*Bearer\s+)[^\s"']+/gi, "$1<redacted>")
		.replace(/(API_KEY|AUTH_TOKEN|TOKEN|SECRET|PASSWORD)=([^\s]+)/gi, "$1=<redacted>");
}
function parseJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}
function killProcessGroup(pid, signal = "SIGTERM") {
	try {
		process.kill(-pid, signal);
	} catch {
		try {
			process.kill(pid, signal);
		} catch {}
	}
}
function run(cmd, args, options = {}) {
	return new Promise((resolveRun) => {
		const child = spawn(cmd, args, {
			cwd: options.cwd ?? root,
			env: { ...process.env, ...(options.env ?? {}) },
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		const timeoutMs = options.timeoutMs ?? 60000;
		const timer = setTimeout(() => {
			timedOut = true;
			killProcessGroup(child.pid, "SIGTERM");
			setTimeout(() => killProcessGroup(child.pid, "SIGKILL"), 3000).unref();
		}, timeoutMs);
		child.stdout?.on("data", (chunk) => {
			stdout += String(chunk);
			if (stdout.length > 10 * 1024 * 1024) stdout = stdout.slice(-10 * 1024 * 1024);
		});
		child.stderr?.on("data", (chunk) => {
			stderr += String(chunk);
			if (stderr.length > 10 * 1024 * 1024) stderr = stderr.slice(-10 * 1024 * 1024);
		});
		child.on("error", (error) => {
			clearTimeout(timer);
			resolveRun({ code: 1, signal: undefined, timedOut, stdout: redact(stdout), stderr: redact(`${stderr}\n${error.message}`), combined: redact(`${stdout}\n${stderr}\n${error.message}`) });
		});
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			killProcessGroup(child.pid, "SIGTERM");
			setTimeout(() => killProcessGroup(child.pid, "SIGKILL"), 1000).unref();
			resolveRun({ code: code ?? (signal ? 128 : 1), signal, timedOut, stdout: redact(stdout), stderr: redact(stderr), combined: redact(`${stdout}\n${stderr}`) });
		});
	});
}
function jshookConfig() {
	const configPaths = ["/root/.config/mcp/mcp.json", "/root/.cursor/mcp.json", "/root/.gemini/config/mcp_config.json"];
	for (const path of configPaths) {
		if (!existsSync(path)) continue;
		try {
			const parsed = JSON.parse(readFileSync(path, "utf8"));
			const jshook = parsed?.mcpServers?.jshook;
			if (jshook?.command) return { source: path, config: jshook };
		} catch {}
	}
	return {
		source: "default-template",
		config: {
			transport: "stdio",
			command: "xvfb-run",
			args: ["-a", "npx", "-y", "@jshookmcp/jshook@latest"],
			env: {
				JSHOOK_BASE_PROFILE: "search",
				PUPPETEER_EXECUTABLE_PATH: "/snap/bin/chromium",
				DISPLAY: ":99",
			},
		},
	};
}
function writeTempMcpConfig() {
	const agentDir = join(tempRoot, "agent");
	const workDir = join(tempRoot, "work");
	mkdirSync(agentDir, { recursive: true, mode: 0o700 });
	mkdirSync(workDir, { recursive: true, mode: 0o700 });
	const selected = jshookConfig();
	const config = {
		...selected.config,
		transport: selected.config.transport ?? (selected.config.url ? "http" : "stdio"),
		autoRegisterTools: true,
		deferToolSchemas: true,
		timeoutMs: Number(selected.config.timeoutMs ?? 45000),
		poolIdleMs: Number(selected.config.poolIdleMs ?? 15000),
	};
	writeFileSync(join(agentDir, "mcp.json"), JSON.stringify({ mcpServers: { jshook: config } }, null, 2), { encoding: "utf8", mode: 0o600 });
	return { agentDir, workDir, source: selected.source, configHash: sha256(JSON.stringify(config)) };
}
function writeRuntimePoolScript(path, browser) {
	writeFileSync(
		path,
		`
import { createMcpManager } from ${JSON.stringify(join(root, "packages/coding-agent/src/core/mcp-manager.ts"))};
function text(result) { return result.content.map((item) => item.type === "text" ? item.text : "[" + item.type + ":" + (item.mimeType || "unknown") + "]").join("\\n"); }
async function main() {
  const manager = createMcpManager({ cwd: ${JSON.stringify(root)}, agentDir: process.env.REPI_CODING_AGENT_DIR });
  const evidence = [];
  try {
    const probe1 = await manager.probeServer("jshook");
    evidence.push({ step: "probe1", ok: probe1.ok, toolCount: probe1.tools.length, hasSearchTools: probe1.tools.some((tool) => tool.name === "search_tools"), hasCallTool: probe1.tools.some((tool) => tool.name === "call_tool") });
    const route = await manager.callTool("jshook", "route_tool", { task: "open a browser page and inspect DOM", context: { maxRecommendations: 3 } });
    evidence.push({ step: "route_tool", isError: route.isError, hasCallToolHint: text(route).includes("call_tool") });
    const viaRouter = await manager.callTool("jshook", "call_tool", { name: "browser_status", args: {} });
    evidence.push({ step: "call_tool_browser_status", isError: viaRouter.isError, hasPagesCount: text(viaRouter).includes("pagesCount") });
    const resources = await manager.listResources("jshook");
    evidence.push({ step: "resources", ok: resources.ok, hasGraph: resources.resources.some((resource) => resource.uri === "jshook://evidence/graph.md") });
    const graph = await manager.readResource("jshook", "jshook://evidence/graph.md");
    evidence.push({ step: "read_resource", isError: graph.isError, hasGraphText: text(graph).includes("Reverse Evidence Graph") });
    const prompts = await manager.listPrompts("jshook");
    evidence.push({ step: "prompts", ok: prompts.ok, hasAntiDebug: prompts.prompts.some((prompt) => prompt.name === "analyze_anti_debug") });
    const prompt = await manager.getPrompt("jshook", "analyze_anti_debug", {});
    evidence.push({ step: "get_prompt", isError: prompt.isError, hasBypassText: text(prompt).includes("Anti-Debug Bypass") });
    const activate = await manager.callTool("jshook", "activate_tools", { names: ["browser_status"] });
    evidence.push({ step: "activate_browser_status", isError: activate.isError });
    const probe2 = await manager.probeServer("jshook");
    evidence.push({ step: "probe2", ok: probe2.ok, hasBrowserStatus: probe2.tools.some((tool) => tool.name === "browser_status") });
    const direct = await manager.callTool("jshook", "browser_status", {});
    evidence.push({ step: "direct_browser_status", isError: direct.isError, hasPagesCount: text(direct).includes("pagesCount") });
    if (${browser ? "true" : "false"}) {
      const launch = await manager.callTool("jshook", "call_tool", { name: "browser_launch", args: { driver: "chrome", headless: true, userDataDir: ${JSON.stringify(join(tempRoot, "browser-profile"))}, args: ["--no-sandbox", "--disable-dev-shm-usage"] } });
      evidence.push({ step: "browser_launch", isError: launch.isError, hasLaunched: text(launch).includes("Browser launched successfully") });
      const nav = await manager.callTool("jshook", "call_tool", { name: "page_navigate", args: { url: "data:text/html,<title>REPI-JSHOOK-LIVE</title><main id=proof>agent-mcp-ok</main>", waitUntil: "domcontentloaded", timeout: 15000 } });
      evidence.push({ step: "page_navigate", isError: nav.isError, hasTitle: text(nav).includes("REPI-JSHOOK-LIVE") });
      const evalResult = await manager.callTool("jshook", "call_tool", { name: "page_evaluate", args: { expression: "document.title + '|' + document.querySelector('#proof')?.textContent" } });
      evidence.push({ step: "page_evaluate", isError: evalResult.isError, hasProof: text(evalResult).includes("REPI-JSHOOK-LIVE|agent-mcp-ok") });
      await manager.callTool("jshook", "call_tool", { name: "browser_close", args: {} }).catch(() => undefined);
    }
    console.log(JSON.stringify({ ok: evidence.every((item) => item.ok !== false && item.isError !== true && item.hasSearchTools !== false && item.hasCallTool !== false && item.hasCallToolHint !== false && item.hasPagesCount !== false && item.hasGraph !== false && item.hasGraphText !== false && item.hasAntiDebug !== false && item.hasBypassText !== false && item.hasBrowserStatus !== false && item.hasLaunched !== false && item.hasTitle !== false && item.hasProof !== false), evidence }, null, 2));
  } finally {
    await manager.closeAll();
  }
}
main().catch((error) => { console.error(error?.stack || error); process.exit(1); });
`,
		{ encoding: "utf8", mode: 0o600 },
	);
}
async function cleanupTempProcesses() {
	await run("bash", ["-lc", `set +e\nfor pid in $(ps -eo pid,cmd | grep ${JSON.stringify(tempRoot)} | grep -v grep | awk '{print $1}'); do kill -TERM "$pid" 2>/dev/null || true; done\nsleep 1\nfor pid in $(ps -eo pid,cmd | grep ${JSON.stringify(tempRoot)} | grep -v grep | awk '{print $1}'); do kill -KILL "$pid" 2>/dev/null || true; done`], { timeoutMs: 5000 });
}

async function main() {
	try {
		if (!live) {
			check("live:disabled", "pass", { message: "set REPI_JSHOOK_MCP_LIVE=1 to run the local jshook MCP live gate" });
		} else {
			const setup = writeTempMcpConfig();
			check("setup:jshook-config", "pass", { source: setup.source, configHash: setup.configHash, agentDir: setup.agentDir });
			const runtimeScript = join(tempRoot, "jshook-runtime-pool-live.ts");
			writeRuntimePoolScript(runtimeScript, browserLive);
			const runtime = await run("npm", ["exec", "--", "tsx", runtimeScript], {
				cwd: root,
				env: { REPI_CODING_AGENT_DIR: setup.agentDir, REPI_AGENT_DIR: setup.agentDir },
				timeoutMs: browserLive ? 120000 : 60000,
			});
			const parsed = parseJson(runtime.stdout);
			check("runtime:pooled-jshook", runtime.code === 0 && parsed?.ok === true ? "pass" : "fail", {
				code: runtime.code,
				signal: runtime.signal,
				timedOut: runtime.timedOut,
				browserLive,
				report: parsed,
				stdoutTail: runtime.stdout.slice(-3000),
				stderrTail: runtime.stderr.slice(-3000),
			});
		}
	} finally {
		await cleanupTempProcesses();
	}
	const failed = checks.filter((item) => item.status !== "pass");
	const report = { kind: "repi-jshook-mcp-live-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, live, browserLive, tempRoot, checks };
	if (json) console.log(JSON.stringify(report, null, 2));
	else {
		console.log("REPI JSHook MCP Live Gate");
		for (const item of checks) console.log(`${item.status === "pass" ? "PASS" : "FAIL"} ${item.id}`);
		console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
	}
	if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
	if (strict && !report.ok) process.exit(1);
}

main().catch(async (error) => {
	check("gate:exception", "fail", { error: redact(error?.stack || error?.message || String(error)) });
	await cleanupTempProcesses().catch(() => undefined);
	const report = { kind: "repi-jshook-mcp-live-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: false, live, browserLive, tempRoot, checks };
	console.log(json ? JSON.stringify(report, null, 2) : `REPI JSHook MCP Live Gate\nFAIL gate:exception\n${redact(error?.stack || error?.message || String(error))}`);
	if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
	process.exit(1);
});
