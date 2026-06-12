#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : process.cwd());
const json = process.argv.includes("--json");
const agentDir = process.env.REPI_CODING_AGENT_DIR || process.env.REPI_AGENT_DIR || join(homedir(), ".repi", "agent");
const repiBin = join(root, "repi");
const runtimeMemory = join(agentDir, "recon", "memory");

function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return undefined;
	}
}

function fileBytes(path) {
	try {
		return statSync(path).size;
	} catch {
		return 0;
	}
}

function lineCount(path) {
	try {
		return readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim()).length;
	} catch {
		return 0;
	}
}

function check(id, pass, evidence, fix) {
	return { id, status: pass ? "pass" : "fail", evidence, fix };
}

function run(cmd, args, options = {}) {
	const result = spawnSync(cmd, args, {
		cwd: root,
		env: {
			...process.env,
			REPI_OFFLINE: "1",
			REPI_SKIP_VERSION_CHECK: "1",
			REPI_SKIP_PACKAGE_UPDATE_CHECK: "1",
			REPI_TELEMETRY: "0",
		},
		encoding: "utf8",
		timeout: options.timeout ?? 20_000,
		maxBuffer: 2 * 1024 * 1024,
	});
	return {
		code: result.status ?? 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		error: result.error ? String(result.error.message || result.error) : undefined,
	};
}

function symlinkTarget(path) {
	try {
		if (!lstatSync(path).isSymbolicLink()) return undefined;
		return resolve(path, "..");
	} catch {
		return undefined;
	}
}

const settings = readJson(join(agentDir, "settings.json"));
const memory = settings?.memory ?? {};
const models = readJson(join(agentDir, "models.json"));
const help = existsSync(repiBin) ? run(repiBin, ["--offline", "--help"], { timeout: 20_000 }) : { code: 1, stdout: "", stderr: "missing repi" };
const listModels = existsSync(repiBin) ? run(repiBin, ["--offline", "--list-models"], { timeout: 25_000 }) : { code: 1, stdout: "", stderr: "missing repi" };
const helpText = `${help.stdout}\n${help.stderr}`;
const installedRepi = "/usr/local/bin/repi";

const checks = [
	check("repo:root", existsSync(join(root, "package.json")) && existsSync(repiBin), `root=${root}`),
	check("launcher:local", existsSync(repiBin), `path=${repiBin}`, "run npm run install:repi"),
	check(
		"launcher:global",
		existsSync(installedRepi),
		`path=${installedRepi} bytes=${fileBytes(installedRepi)} symlink=${lstatSync(installedRepi).isSymbolicLink?.() ?? false}`,
		"run npm run install:repi",
	),
	check("runtime:agent-dir", existsSync(agentDir), `agentDir=${agentDir}`, "run npm run install:repi"),
	check("runtime:settings", Boolean(settings), `settings=${join(agentDir, "settings.json")}`, "run npm run install:repi"),
	check(
		"memory:scoped-defaults",
		memory.schemaVersion === 2 && memory.mode === "scoped" && memory.autoRecall === true && memory.autoDeposit === "high-value" && memory.startupDigest === "scoped" && memory.rawAutoInject === false,
		`memory=${JSON.stringify({ schemaVersion: memory.schemaVersion, mode: memory.mode, autoRecall: memory.autoRecall, autoDeposit: memory.autoDeposit, startupDigest: memory.startupDigest, rawAutoInject: memory.rawAutoInject })}`,
		"run npm run install:repi or edit ~/.repi/agent/settings.json",
	),
	check("memory:core-file", existsSync(join(runtimeMemory, "core-memory.md")), `path=${join(runtimeMemory, "core-memory.md")}`, "run npm run install:repi"),
	check("memory:project-file", existsSync(join(runtimeMemory, "project-memory.md")), `path=${join(runtimeMemory, "project-memory.md")}`, "run npm run install:repi"),
	check("memory:procedural-file", existsSync(join(runtimeMemory, "procedural-memory.md")), `path=${join(runtimeMemory, "procedural-memory.md")}`, "run npm run install:repi"),
	check("memory:event-store", existsSync(join(runtimeMemory, "events.jsonl")), `events=${lineCount(join(runtimeMemory, "events.jsonl"))}`, "run repi memory consolidate after real tasks"),
	check("models:parse", listModels.code === 0, `exit=${listModels.code} stdout=${listModels.stdout.slice(0, 120).replace(/\s+/g, " ")} stderr=${listModels.stderr.slice(0, 120).replace(/\s+/g, " ")}`, "fix ~/.repi/agent/models.json"),
	check("models:config-present", Boolean(models) || listModels.code === 0, `modelsJson=${Boolean(models)} listModelsExit=${listModels.code}`, "configure ~/.repi/agent/models.json if no provider exists"),
	check("cli:help", help.code === 0 && /REPI reverse\/pentest/.test(helpText), `exit=${help.code}`, "run npm install && npm run install:repi"),
	check("network:update-suppressed", /--offline/.test(helpText) && /REPI_SKIP_VERSION_CHECK/.test(helpText), "offline/version-check controls available"),
];

const result = {
	kind: "repi-doctor-report",
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	root,
	agentDir,
	repiBin,
	installedRepi,
	checks,
	ok: checks.every((item) => item.status === "pass"),
};

if (json) {
	console.log(JSON.stringify(result, null, 2));
} else {
	console.log("REPI Doctor");
	console.log(`root: ${root}`);
	console.log(`agentDir: ${agentDir}`);
	for (const item of checks) {
		console.log(`${item.status === "pass" ? "PASS" : "FAIL"} ${item.id} :: ${item.evidence}`);
		if (item.status !== "pass" && item.fix) console.log(`  fix: ${item.fix}`);
	}
	console.log(`verdict: ${result.ok ? "pass" : "fail"}`);
}

process.exit(result.ok ? 0 : 1);
