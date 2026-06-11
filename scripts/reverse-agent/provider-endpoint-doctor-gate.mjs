#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const sha256 = (value) => createHash("sha256").update(String(value ?? "")).digest("hex");
const shortHash = (value) => sha256(value).slice(0, 24);
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const SECRET = "doctor-env-token";
const MODEL = "doctor/mock-model";

function markerCheck(id, path, markers) {
	const full = join(root, path);
	if (!existsSync(full)) return check(id, false, { path, exists: false });
	const text = readFileSync(full, "utf8");
	const missing = markers.filter((marker) => !text.includes(marker));
	return check(id, missing.length === 0, { path, missing, sha256: shortHash(text) });
}

function readBody(req) {
	return new Promise((resolveBody) => {
		let body = "";
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			body += chunk;
		});
		req.on("end", () => resolveBody(body));
	});
}

async function startMockProvider() {
	const requests = [];
	const server = createServer(async (req, res) => {
		const body = await readBody(req);
		let parsed = {};
		try {
			parsed = JSON.parse(body || "{}");
		} catch {}
		requests.push({ method: req.method, url: req.url, authorization: req.headers.authorization, xApiKey: req.headers["x-api-key"], body: parsed });
		res.setHeader("content-type", "application/json");
		if (req.method === "POST" && req.url === "/v1/chat/completions") {
			const marker = parsed?.messages?.[0]?.content?.match(/REPI_PROVIDER_DOCTOR_[A-Z_]+_OK/)?.[0] ?? "REPI_PROVIDER_DOCTOR_CHAT_OK";
			res.writeHead(200);
			res.end(JSON.stringify({ id: "chatcmpl-doctor", object: "chat.completion", model: parsed.model, choices: [{ index: 0, message: { role: "assistant", content: marker }, finish_reason: "stop" }] }));
			return;
		}
		if (req.method === "POST" && req.url === "/v1/messages") {
			const marker = parsed?.messages?.[0]?.content?.match(/REPI_PROVIDER_DOCTOR_[A-Z_]+_OK/)?.[0] ?? "REPI_PROVIDER_DOCTOR_ANTHROPIC_OK";
			res.writeHead(200);
			res.end(JSON.stringify({ id: "msg-doctor", type: "message", role: "assistant", model: parsed.model, content: [{ type: "text", text: marker }], stop_reason: "end_turn" }));
			return;
		}
		if (req.method === "POST" && req.url === "/v1/responses") {
			res.writeHead(404);
			res.end(JSON.stringify({ error: { message: "Endpoint not found: POST /v1/responses", type: "not_found" } }));
			return;
		}
		res.writeHead(404);
		res.end(JSON.stringify({ error: { message: `Endpoint not found: ${req.method} ${req.url}`, type: "not_found" } }));
	});
	await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
	const address = server.address();
	return { server, requests, baseUrl: `http://127.0.0.1:${address.port}` };
}

function runRepi(args, env = {}) {
	return new Promise((resolveRun) => {
		const child = spawn(join(root, "repi"), args, {
			cwd: root,
			env: {
				...process.env,
				REPI_PROVIDER_DOCTOR_KEY: SECRET,
				REPI_SKIP_VERSION_CHECK: "1",
				REPI_SKIP_PACKAGE_UPDATE_CHECK: "1",
				REPI_TELEMETRY: "0",
				PI_SKIP_VERSION_CHECK: "1",
				PI_SKIP_PACKAGE_UPDATE_CHECK: "1",
				PI_TELEMETRY: "0",
				...env,
			},
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("close", (code, signal) => resolveRun({ code, signal, stdout, stderr, stdoutSha256: sha256(stdout), stderrSha256: sha256(stderr) }));
		child.on("error", (error) => resolveRun({ code: 127, signal: null, stdout, stderr: `${stderr}\n${error.message}`, stdoutSha256: sha256(stdout), stderrSha256: sha256(`${stderr}\n${error.message}`) }));
	});
}

function parseJsonOutput(run) {
	try {
		return JSON.parse(run.stdout);
	} catch {
		return null;
	}
}

function validateDoctorReport(report) {
	const errors = [];
	if (report?.kind !== "ProviderEndpointDoctorV1") errors.push("kind_invalid");
	if (report?.schemaVersion !== 1) errors.push("schemaVersion_invalid");
	if (report?.mode !== "live") errors.push("mode_not_live");
	if (report?.recommendedApi !== "openai-completions") errors.push("recommended_api_not_chat_completions");
	if (!String(report?.recommendedBaseUrl || "").endsWith("/v1")) errors.push("recommended_base_url_missing_v1");
	const probes = report?.probes ?? [];
	const byApi = new Map(probes.map((probe) => [probe.api, probe]));
	if (byApi.get("openai-completions")?.status !== "pass") errors.push("chat_completions_not_pass");
	if (byApi.get("anthropic-messages")?.status !== "pass") errors.push("anthropic_not_pass");
	if (byApi.get("openai-responses")?.classification !== "endpoint_not_found") errors.push("responses_404_not_diagnosed");
	if (!String(report?.modelsJsonTemplate || "").includes('"apiKey": "$REPI_PROVIDER_DOCTOR_KEY"')) errors.push("template_not_env_ref");
	if (String(report?.modelsJsonTemplate || "").includes(SECRET)) errors.push("template_contains_secret");
	if (JSON.stringify(report).includes(SECRET)) errors.push("report_contains_secret");
	if (report?.secretHandling?.envRefOnly !== true || report?.secretHandling?.literalApiKeySuppressed !== true) errors.push("secret_handling_not_proven");
	if (!report?.diagnostics?.some((item) => String(item).includes("openai-responses endpoint not found"))) errors.push("responses_diagnostic_missing");
	return { ok: errors.length === 0, errors };
}

function validateTemplateOnlyReport(report) {
	const errors = [];
	if (report?.kind !== "ProviderEndpointDoctorV1") errors.push("kind_invalid");
	if (report?.mode !== "template-only") errors.push("mode_not_template_only");
	if (report?.recommendedApi) errors.push("template_only_should_not_recommend_live_api");
	if (report?.probes?.[0]?.status !== "skipped") errors.push("template_probe_not_skipped");
	if (!String(report?.modelsJsonTemplate || "").includes('"api": "openai-responses"')) errors.push("responses_template_missing");
	if (!String(report?.modelsJsonTemplate || "").includes('"apiKey": "$REPI_PROVIDER_DOCTOR_KEY"')) errors.push("template_not_env_ref");
	return { ok: errors.length === 0, errors };
}

function mutateReport(report, id) {
	const clone = JSON.parse(JSON.stringify(report));
	if (id === "secret-leak") clone.probes[0].errorPreview = SECRET;
	if (id === "missing-responses-diagnostic") clone.diagnostics = [];
	if (id === "wrong-recommendation") clone.recommendedApi = "openai-responses";
	return clone;
}

async function main() {
	const checks = [];
	let doctorReport = null;
	let templateReport = null;
	let requestSummary = [];
	const mock = await startMockProvider();
	try {
		const liveRun = await runRepi(["provider-doctor", "--base-url", mock.baseUrl, "--model", MODEL, "--provider-name", "doctor-provider", "--api-key-env", "REPI_PROVIDER_DOCTOR_KEY", "--json"]);
		doctorReport = parseJsonOutput(liveRun);
		const validation = validateDoctorReport(doctorReport);
		checks.push(check("runtime:provider-endpoint-doctor-live", liveRun.code === 0 && validation.ok, { code: liveRun.code, validation, stdoutSha256: liveRun.stdoutSha256, stderrTail: liveRun.stderr.slice(-1000) }));
		requestSummary = mock.requests.map((request) => ({ method: request.method, url: request.url, authorizationFromEnv: request.authorization === `Bearer ${SECRET}`, xApiKeyFromEnv: request.xApiKey === SECRET, model: request.body?.model }));
		checks.push(check("runtime:provider-endpoint-doctor-request-coverage", requestSummary.some((row) => row.url === "/v1/chat/completions" && row.authorizationFromEnv) && requestSummary.some((row) => row.url === "/v1/responses") && requestSummary.some((row) => row.url === "/v1/messages" && row.xApiKeyFromEnv), { requestSummary }));
		checks.push(check("runtime:provider-endpoint-doctor-no-product-leak", !/Update Available|pi\.dev\/changelog|\.pi\/|~\/\.pi/i.test(`${liveRun.stdout}\n${liveRun.stderr}`), { stdoutSha256: liveRun.stdoutSha256, stderrSha256: liveRun.stderrSha256 }));
		const templateRun = await runRepi(["provider-doctor", "--base-url", `${mock.baseUrl}/v1`, "--model", MODEL, "--provider-name", "doctor-provider", "--api-key-env", "REPI_PROVIDER_DOCTOR_KEY", "--api", "openai-responses", "--template-only", "--json"], { REPI_PROVIDER_DOCTOR_KEY: "" });
		templateReport = parseJsonOutput(templateRun);
		const templateValidation = validateTemplateOnlyReport(templateReport);
		checks.push(check("runtime:provider-endpoint-doctor-template-only", templateRun.code === 0 && templateValidation.ok, { code: templateRun.code, validation: templateValidation, stdoutSha256: templateRun.stdoutSha256 }));
		const negatives = ["secret-leak", "missing-responses-diagnostic", "wrong-recommendation"].map((id) => {
			const result = validateDoctorReport(mutateReport(doctorReport, id));
			return { id, rejected: !result.ok, errors: result.errors };
		});
		checks.push(check("negative:provider-endpoint-doctor-report", negatives.every((row) => row.rejected), { negatives }));
	} finally {
		await new Promise((resolveClose) => mock.server.close(resolveClose));
	}
	checks.push(
		markerCheck("code:provider-endpoint-doctor-cli", "packages/coding-agent/src/cli/provider-doctor.ts", ["ProviderEndpointDoctorV1", "openai-completions", "openai-responses", "anthropic-messages", "endpoint_not_found", "models.json template"]),
		markerCheck("code:provider-endpoint-doctor-main", "packages/coding-agent/src/main.ts", ["handleProviderDoctorCommand"]),
		markerCheck("harness:provider-endpoint-doctor", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:provider-endpoint-doctor", "provider:endpoint-doctor-runtime", "ProviderEndpointDoctorV1"]),
		markerCheck("autonomy:provider-endpoint-doctor", "scripts/reverse-agent/autonomy-control-plane.mjs", ["provider_endpoint_doctor", "ProviderEndpointDoctorV1", "gate:provider-endpoint-doctor"]),
		markerCheck("npm:provider-endpoint-doctor", "package.json", ["gate:provider-endpoint-doctor", "provider-endpoint-doctor-gate.mjs"]),
		markerCheck("docs:provider-endpoint-doctor-readme", "README.md", ["Provider Endpoint Doctor", "provider-doctor", "gate:provider-endpoint-doctor"]),
		markerCheck("docs:provider-endpoint-doctor-runtime-config", "docs/reverse-agent/repi-runtime-configuration.md", ["provider-doctor", "openai-responses", "endpoint_not_found"]),
	);
	const failed = checks.filter((row) => row.status !== "pass");
	const result = { kind: "repi-provider-endpoint-doctor-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ProviderEndpointDoctorV1: true, ok: failed.length === 0, root, checks, requestSummary, doctorReportSummary: doctorReport ? { recommendedApi: doctorReport.recommendedApi, recommendedBaseUrl: doctorReport.recommendedBaseUrl, diagnostics: doctorReport.diagnostics, probeCount: doctorReport.probes?.length } : null, templateOnlySummary: templateReport ? { mode: templateReport.mode, probeCount: templateReport.probes?.length } : null };
	if (writeEvidence) {
		const dir = join(root, ".repi-harness", "evidence", "provider-endpoint-doctor", result.generatedAt.replace(/[:.]/g, "-"));
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
	}
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Provider Endpoint Doctor Gate");
		for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
		console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
	}
	if (strict && failed.length) process.exitCode = 1;
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
