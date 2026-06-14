import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AgentToolResult } from "@pi-recon/repi-agent-core";
import { Type } from "typebox";
import { APP_NAME, getAgentDir, VERSION } from "../config.ts";
import type { ToolDefinition } from "./extensions/types.ts";

export type McpTransport = "stdio" | "http";

export interface McpServerConfig {
	transport?: McpTransport;
	command?: string;
	args?: string[];
	cwd?: string;
	env?: Record<string, string>;
	url?: string;
	headers?: Record<string, string>;
	/** Optional bearer token value or env reference, e.g. "$MCP_TOKEN". */
	bearerToken?: string;
	disabled?: boolean;
	timeoutMs?: number;
	allowedTools?: string[];
	blockedTools?: string[];
	/** Opt-in: expose this server as runtime LLM-callable MCP tools. */
	autoRegisterTools?: boolean;
	/** Compatibility alias for older local configs. */
	enableTools?: boolean;
}

export interface McpConfigFile {
	mcpServers?: Record<string, McpServerConfig>;
	servers?: Record<string, McpServerConfig>;
}

export interface McpServerEntry {
	id: string;
	config: McpServerConfig;
	sourcePath: string;
}

export interface McpToolSummary {
	name: string;
	description?: string;
	inputSchema?: unknown;
}

export interface McpResourceSummary {
	uri: string;
	name?: string;
	description?: string;
	mimeType?: string;
}

export interface McpPromptSummary {
	name: string;
	description?: string;
	arguments?: unknown;
}

export interface McpProbeResult {
	serverId: string;
	ok: boolean;
	transport: McpTransport;
	command?: string;
	url?: string;
	protocolVersion?: string;
	serverInfo?: unknown;
	capabilities?: unknown;
	tools: McpToolSummary[];
	stderrTail?: string;
	error?: string;
}

export interface McpToolArtifact {
	path: string;
	sha256: string;
	bytes: number;
	previewChars: number;
}

export interface McpToolCallDetails {
	serverId: string;
	toolName: string;
	isError: boolean;
	contentItems: number;
	artifacts?: McpToolArtifact[];
	stderrTail?: string;
}

export interface McpToolCallResult {
	content: AgentToolResult<McpToolCallDetails>["content"];
	details: McpToolCallDetails;
	isError: boolean;
}

export interface McpResourceListResult {
	serverId: string;
	ok: boolean;
	resources: McpResourceSummary[];
	stderrTail?: string;
	error?: string;
}

export interface McpPromptListResult {
	serverId: string;
	ok: boolean;
	prompts: McpPromptSummary[];
	stderrTail?: string;
	error?: string;
}

export interface McpManagerOptions {
	cwd: string;
	agentDir?: string;
}

const DEFAULT_MCP_TIMEOUT_MS = 10000;
const MCP_TOOL_ARTIFACT_THRESHOLD_CHARS = 20000;
const MCP_TOOL_INLINE_PREVIEW_CHARS = 12000;
const MCP_TOOL_FALLBACK_TRUNCATE_CHARS = 64000;

const mcpProxyToolSchema = Type.Object({
	tool: Type.String({ description: "Original MCP tool name to call on this server" }),
	arguments: Type.Optional(
		Type.Record(Type.String(), Type.Any(), { description: "Arguments passed to the MCP tool" }),
	),
});

const mcpResourceListSchema = Type.Object({});

const mcpResourceReadSchema = Type.Object({
	uri: Type.String({ description: "MCP resource URI to read" }),
});

const mcpPromptListSchema = Type.Object({});

const mcpPromptGetSchema = Type.Object({
	name: Type.String({ description: "MCP prompt name to get" }),
	arguments: Type.Optional(Type.Record(Type.String(), Type.Any(), { description: "Prompt arguments" })),
});

const SECRET_PATTERNS: Array<[RegExp, string]> = [
	[/\bsk-[A-Za-z0-9_-]{8,}\b/g, "<redacted:api-key>"],
	[/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>"],
	[/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>"],
	[/(Authorization\s*[:=]\s*Bearer\s+)[^\s"']+/gi, "$1<redacted>"],
	[/(API_KEY|AUTH_TOKEN|TOKEN|SECRET|PASSWORD)=([^\s]+)/gi, "$1=<redacted>"],
];

function redact(text: string): string {
	let out = text;
	for (const [pattern, replacement] of SECRET_PATTERNS) out = out.replace(pattern, replacement);
	return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonFile(path: string): McpConfigFile | undefined {
	if (!existsSync(path)) return undefined;
	try {
		return JSON.parse(readFileSync(path, "utf8")) as McpConfigFile;
	} catch {
		return undefined;
	}
}

function normalizeTransport(config: McpServerConfig): McpTransport {
	if (config.transport === "http" || config.url) return "http";
	return "stdio";
}

function envValue(value: string): string {
	if (value.startsWith("$") && value.length > 1) return process.env[value.slice(1)] ?? "";
	return value;
}

function expandHeaderValue(value: string): string {
	return envValue(value).replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name: string) => process.env[name] ?? "");
}

function expandEnv(env?: Record<string, string>): NodeJS.ProcessEnv {
	const result: NodeJS.ProcessEnv = { ...process.env };
	for (const [key, value] of Object.entries(env ?? {})) result[key] = envValue(value);
	return result;
}

function expandHeaders(config: McpServerConfig): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(config.headers ?? {})) headers[key] = expandHeaderValue(value);
	if (config.bearerToken && !Object.keys(headers).some((key) => key.toLowerCase() === "authorization")) {
		headers.Authorization = `Bearer ${envValue(config.bearerToken)}`;
	}
	return headers;
}

function redactedConfig(config: McpServerConfig): McpServerConfig {
	const env = config.env
		? Object.fromEntries(
				Object.entries(config.env).map(([key, value]) => [key, value.startsWith("$") ? value : "<redacted>"]),
			)
		: undefined;
	const headers = config.headers
		? Object.fromEntries(
				Object.entries(config.headers).map(([key, value]) => [key, value.startsWith("$") ? value : "<redacted>"]),
			)
		: undefined;
	const bearerToken = config.bearerToken
		? config.bearerToken.startsWith("$")
			? config.bearerToken
			: "<redacted>"
		: undefined;
	return { ...config, env, headers, bearerToken };
}

function sanitizeToolNamePart(value: string, fallback: string): string {
	const sanitized = value
		.replace(/[^A-Za-z0-9_]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");
	return (sanitized || fallback).slice(0, 64);
}

function shortHash(value: string): string {
	return createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function createMcpToolName(serverId: string, toolName: string): string {
	const server = sanitizeToolNamePart(serverId, "server");
	const tool = sanitizeToolNamePart(toolName, "tool");
	const base = `mcp__${server}__${tool}`;
	if (base.length <= 96) return base;
	return `mcp__${server.slice(0, 32)}__${tool.slice(0, 40)}__${shortHash(`${serverId}/${toolName}`)}`;
}

function createMcpProxyToolName(serverId: string): string {
	return `mcp__${sanitizeToolNamePart(serverId, "server")}__call`;
}

function createMcpResourceListToolName(serverId: string): string {
	return `mcp__${sanitizeToolNamePart(serverId, "server")}__list_resources`;
}

function createMcpResourceReadToolName(serverId: string): string {
	return `mcp__${sanitizeToolNamePart(serverId, "server")}__read_resource`;
}

function createMcpPromptListToolName(serverId: string): string {
	return `mcp__${sanitizeToolNamePart(serverId, "server")}__list_prompts`;
}

function createMcpPromptGetToolName(serverId: string): string {
	return `mcp__${sanitizeToolNamePart(serverId, "server")}__get_prompt`;
}

function normalizeInputSchema(inputSchema: unknown): ToolDefinition["parameters"] {
	if (!isRecord(inputSchema)) return Type.Object({}, { additionalProperties: true });
	const schema = structuredClone(inputSchema) as Record<string, unknown>;
	if (!schema.type && isRecord(schema.properties)) schema.type = "object";
	return schema as ToolDefinition["parameters"];
}

function normalizeToolArgs(args: unknown): Record<string, unknown> {
	return isRecord(args) ? args : {};
}

function textFromContent(content: McpToolCallResult["content"]): string {
	return content
		.map((item) => (item.type === "text" ? item.text : `[image:${item.mimeType}]`))
		.join("\n")
		.trim();
}

interface NormalizedMcpContent {
	content: McpToolCallResult["content"];
	artifacts: McpToolArtifact[];
}

function inlineMcpText(text: string): string {
	const redacted = redact(text);
	if (redacted.length <= MCP_TOOL_FALLBACK_TRUNCATE_CHARS) return redacted;
	return `${redacted.slice(0, MCP_TOOL_FALLBACK_TRUNCATE_CHARS)}

[truncated MCP tool output at ${MCP_TOOL_FALLBACK_TRUNCATE_CHARS} chars]`;
}

function toAgentToolResult(result: McpToolCallResult): AgentToolResult<McpToolCallDetails> {
	if (result.isError) throw new Error(textFromContent(result.content) || "MCP tool returned an error");
	return { content: result.content, details: result.details };
}

interface McpJsonRpcClient {
	stderrTail: string;
	request(method: string, params?: Record<string, unknown>, timeoutMs?: number, signal?: AbortSignal): Promise<any>;
	notify(
		method: string,
		params?: Record<string, unknown>,
		timeoutMs?: number,
		signal?: AbortSignal,
	): Promise<void> | void;
	close(timeoutMs?: number): Promise<void> | void;
}

function parseSseJsonMessages(text: string): any[] {
	const messages: any[] = [];
	for (const rawEvent of text.split(/\r?\n\r?\n/)) {
		const dataLines = rawEvent
			.split(/\r?\n/)
			.filter((line) => line.startsWith("data:"))
			.map((line) => line.slice(5).trimStart());
		if (dataLines.length === 0) continue;
		const data = dataLines.join("\n").trim();
		if (!data || data === "[DONE]") continue;
		try {
			messages.push(JSON.parse(data));
		} catch {}
	}
	return messages;
}

function createAbortController(timeoutMs: number, signal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
	const controller = new AbortController();
	const onAbort = () => controller.abort(signal?.reason);
	const timer = setTimeout(() => controller.abort(new Error("MCP HTTP request timeout")), timeoutMs);
	if (signal?.aborted) controller.abort(signal.reason);
	else signal?.addEventListener("abort", onAbort, { once: true });
	return {
		signal: controller.signal,
		cleanup: () => {
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
		},
	};
}

class StreamableHttpJsonRpcClient implements McpJsonRpcClient {
	private nextId = 1;
	private protocolVersion = "2025-11-25";
	private sessionId: string | undefined;
	private entry: McpServerEntry;

	constructor(entry: McpServerEntry) {
		this.entry = entry;
		if (!entry.config.url) throw new Error(`MCP HTTP server ${entry.id} is missing url`);
	}

	get stderrTail(): string {
		return "";
	}

	async request(
		method: string,
		params?: Record<string, unknown>,
		timeoutMs = DEFAULT_MCP_TIMEOUT_MS,
		signal?: AbortSignal,
	): Promise<any> {
		const id = this.nextId++;
		const result = await this.post(
			{ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) },
			timeoutMs,
			signal,
			id,
		);
		if (method === "initialize" && isRecord(result)) {
			if (typeof result.protocolVersion === "string") this.protocolVersion = result.protocolVersion;
		}
		return result;
	}

	async notify(
		method: string,
		params?: Record<string, unknown>,
		timeoutMs = DEFAULT_MCP_TIMEOUT_MS,
		signal?: AbortSignal,
	): Promise<void> {
		await this.post({ jsonrpc: "2.0", method, ...(params ? { params } : {}) }, timeoutMs, signal);
	}

	async close(timeoutMs = 1000): Promise<void> {
		if (!this.sessionId) return;
		const abort = createAbortController(timeoutMs, undefined);
		try {
			await fetch(this.entry.config.url as string, {
				method: "DELETE",
				headers: this.buildHeaders(true, false),
				signal: abort.signal,
			}).catch(() => undefined);
		} finally {
			abort.cleanup();
		}
	}

	private async post(
		message: Record<string, unknown>,
		timeoutMs: number,
		signal?: AbortSignal,
		expectId?: number,
	): Promise<any> {
		const abort = createAbortController(timeoutMs, signal);
		let response: Response;
		try {
			response = await fetch(this.entry.config.url as string, {
				method: "POST",
				headers: this.buildHeaders(true, true),
				body: JSON.stringify(message),
				signal: abort.signal,
			});
			const sessionId = response.headers.get("mcp-session-id");
			if (sessionId) this.sessionId = sessionId;
			const bodyText = await response.text();
			if (!response.ok) {
				const body = redact(bodyText);
				throw new Error(`MCP HTTP ${response.status}${body ? `: ${body.slice(0, 1000)}` : ""}`);
			}
			if (!expectId) return undefined;
			const messages = this.parseResponseMessages(response.headers.get("content-type") ?? "", bodyText);
			const messageResult =
				messages.find((item) => item?.id === expectId) ?? messages.find((item) => item?.id !== undefined);
			if (!messageResult) throw new Error("MCP HTTP response did not contain a JSON-RPC result");
			if (messageResult.error) throw new Error(redact(JSON.stringify(messageResult.error)));
			return messageResult.result;
		} catch (error) {
			throw new Error(redact(error instanceof Error ? error.message : String(error)));
		} finally {
			abort.cleanup();
		}
	}

	private parseResponseMessages(contentType: string, bodyText: string): any[] {
		if (!bodyText.trim()) return [];
		if (contentType.includes("text/event-stream")) return parseSseJsonMessages(bodyText);
		try {
			const parsed = JSON.parse(bodyText);
			return Array.isArray(parsed) ? parsed : [parsed];
		} catch {
			const sseMessages = parseSseJsonMessages(bodyText);
			if (sseMessages.length > 0) return sseMessages;
			throw new Error(`MCP HTTP response was not JSON/SSE: ${redact(bodyText.slice(0, 1000))}`);
		}
	}

	private buildHeaders(includeSession: boolean, includeJsonContent: boolean): Record<string, string> {
		const headers: Record<string, string> = {
			...expandHeaders(this.entry.config),
			Accept: "application/json, text/event-stream",
		};
		if (includeJsonContent) headers["Content-Type"] = "application/json";
		if (this.protocolVersion) headers["MCP-Protocol-Version"] = this.protocolVersion;
		if (includeSession && this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
		return headers;
	}
}

class StdioJsonRpcClient implements McpJsonRpcClient {
	private child: ReturnType<typeof spawn>;
	private nextId = 1;
	private buffer = "";
	private stderr = "";
	private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();

	constructor(entry: McpServerEntry) {
		const config = entry.config;
		if (!config.command) throw new Error(`MCP stdio server ${entry.id} is missing command`);
		this.child = spawn(config.command, config.args ?? [], {
			cwd: config.cwd ? resolve(config.cwd) : process.cwd(),
			env: expandEnv(config.env),
			stdio: ["pipe", "pipe", "pipe"],
		});
		this.child.stdout?.on("data", (chunk) => this.onStdout(String(chunk)));
		this.child.stderr?.on("data", (chunk) => {
			this.stderr += redact(String(chunk));
			if (this.stderr.length > 12000) this.stderr = this.stderr.slice(-12000);
		});
		this.child.on("error", (error) => this.rejectAll(error));
		this.child.on("close", (code, signal) =>
			this.rejectAll(new Error(`MCP server exited code=${code ?? "null"} signal=${signal ?? "null"}`)),
		);
	}

	get stderrTail(): string {
		return this.stderr.slice(-4000);
	}

	request(
		method: string,
		params?: Record<string, unknown>,
		timeoutMs = DEFAULT_MCP_TIMEOUT_MS,
		signal?: AbortSignal,
	): Promise<any> {
		const id = this.nextId++;
		const message = { jsonrpc: "2.0", id, method, ...(params ? { params } : {}) };
		return new Promise((resolve, reject) => {
			if (signal?.aborted) {
				reject(new Error("Operation aborted"));
				return;
			}
			const cleanup = () => {
				clearTimeout(timer);
				signal?.removeEventListener("abort", onAbort);
			};
			const onAbort = () => {
				this.pending.delete(id);
				cleanup();
				reject(new Error("Operation aborted"));
			};
			const timer = setTimeout(() => {
				this.pending.delete(id);
				signal?.removeEventListener("abort", onAbort);
				reject(new Error(`MCP request timeout: ${method}`));
			}, timeoutMs);
			signal?.addEventListener("abort", onAbort, { once: true });
			this.pending.set(id, {
				resolve: (value) => {
					cleanup();
					resolve(value);
				},
				reject: (error) => {
					cleanup();
					reject(error);
				},
			});
			this.write(message);
		});
	}

	notify(method: string, params?: Record<string, unknown>): void {
		this.write({ jsonrpc: "2.0", method, ...(params ? { params } : {}) });
	}

	close(): void {
		try {
			this.child.stdin?.end();
		} catch {}
		if (this.child.exitCode === null) this.child.kill("SIGTERM");
		setTimeout(() => {
			if (this.child.exitCode === null) this.child.kill("SIGKILL");
		}, 1000).unref();
	}

	private write(message: unknown): void {
		this.child.stdin?.write(`${JSON.stringify(message)}\n`, "utf8");
	}

	private onStdout(chunk: string): void {
		this.buffer += chunk;
		while (this.buffer.length > 0) {
			if (this.buffer.startsWith("Content-Length:")) {
				if (!this.consumeContentLengthMessage()) break;
				continue;
			}
			if (!this.buffer.includes("\n")) break;
			const index = this.buffer.indexOf("\n");
			const line = this.buffer.slice(0, index).trim();
			this.buffer = this.buffer.slice(index + 1);
			if (!line) continue;
			this.handleMessageLine(line);
		}
	}

	private consumeContentLengthMessage(): boolean {
		const headerEnd = this.buffer.includes("\r\n\r\n")
			? this.buffer.indexOf("\r\n\r\n")
			: this.buffer.indexOf("\n\n");
		if (headerEnd < 0) return false;
		const delimiter = this.buffer.slice(headerEnd, headerEnd + 4).startsWith("\r\n") ? "\r\n\r\n" : "\n\n";
		const header = this.buffer.slice(0, headerEnd);
		const match = header.match(/Content-Length:\s*(\d+)/i);
		if (!match) {
			this.buffer = this.buffer.slice(headerEnd + delimiter.length);
			return true;
		}
		const length = Number(match[1]);
		const start = headerEnd + delimiter.length;
		if (this.buffer.length < start + length) return false;
		const body = this.buffer.slice(start, start + length);
		this.buffer = this.buffer.slice(start + length);
		this.handleMessageLine(body.trim());
		return true;
	}

	private handleMessageLine(line: string): void {
		let message: any;
		try {
			message = JSON.parse(line);
		} catch {
			return;
		}
		if (message.id === undefined) return;
		const pending = this.pending.get(message.id);
		if (!pending) return;
		this.pending.delete(message.id);
		if (message.error) pending.reject(new Error(redact(JSON.stringify(message.error))));
		else pending.resolve(message.result);
	}

	private rejectAll(error: Error): void {
		for (const pending of this.pending.values()) pending.reject(error);
		this.pending.clear();
	}
}

export class McpManager {
	private cwd: string;
	private agentDir: string;

	constructor(options: McpManagerOptions) {
		this.cwd = resolve(options.cwd);
		this.agentDir = options.agentDir ?? getAgentDir();
	}

	configPaths(): string[] {
		return [join(this.agentDir, "mcp.json"), join(this.cwd, ".repi", "mcp.json")];
	}

	loadServers(): McpServerEntry[] {
		const servers = new Map<string, McpServerEntry>();
		for (const sourcePath of this.configPaths()) {
			const parsed = readJsonFile(sourcePath);
			if (!parsed) continue;
			const table = parsed.mcpServers ?? parsed.servers ?? {};
			for (const [id, config] of Object.entries(table)) {
				servers.set(id, { id, config: { transport: normalizeTransport(config), ...config }, sourcePath });
			}
		}
		return Array.from(servers.values()).sort((a, b) => a.id.localeCompare(b.id));
	}

	getServer(id: string): McpServerEntry | undefined {
		return this.loadServers().find((server) => server.id === id || server.id.startsWith(id));
	}

	async probeServer(id: string): Promise<McpProbeResult> {
		const entry = this.getServer(id);
		if (!entry) return { serverId: id, ok: false, transport: "stdio", tools: [], error: "server_not_found" };
		return this.probeEntry(entry);
	}

	async probeAll(): Promise<McpProbeResult[]> {
		const entries = this.loadServers().filter((entry) => !entry.config.disabled);
		const results: McpProbeResult[] = [];
		for (const entry of entries) results.push(await this.probeEntry(entry));
		return results;
	}

	async callTool(
		serverId: string,
		toolName: string,
		args?: unknown,
		signal?: AbortSignal,
	): Promise<McpToolCallResult> {
		const entry = this.getServer(serverId);
		if (!entry) throw new Error(`MCP server not found: ${serverId}`);
		if (entry.config.disabled) throw new Error(`MCP server is disabled: ${entry.id}`);
		if (!this.isToolAllowed(entry, toolName)) throw new Error(`MCP tool is not allowed: ${entry.id}/${toolName}`);
		return this.withInitializedMcpClient(
			entry,
			async (client) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const result = await client.request(
					"tools/call",
					{ name: toolName, arguments: normalizeToolArgs(args) },
					timeoutMs,
					signal,
				);
				const isError = isRecord(result) && result.isError === true;
				const normalized = this.normalizeMcpContent(entry.id, toolName, result);
				return {
					content: normalized.content,
					isError,
					details: {
						serverId: entry.id,
						toolName,
						isError,
						contentItems: normalized.content.length,
						artifacts: normalized.artifacts.length > 0 ? normalized.artifacts : undefined,
						stderrTail: client.stderrTail || undefined,
					},
				};
			},
			signal,
		);
	}

	async listResources(serverId: string, signal?: AbortSignal): Promise<McpResourceListResult> {
		const entry = this.getServer(serverId);
		if (!entry) return { serverId, ok: false, resources: [], error: "server_not_found" };
		if (entry.config.disabled) return { serverId: entry.id, ok: false, resources: [], error: "server_disabled" };
		return this.withInitializedMcpClient(
			entry,
			async (client) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const listed = await client.request("resources/list", {}, timeoutMs, signal);
				const resources = this.filterResources(listed?.resources);
				return { serverId: entry.id, ok: true, resources, stderrTail: client.stderrTail || undefined };
			},
			signal,
		).catch((error) => ({
			serverId: entry.id,
			ok: false,
			resources: [],
			error: redact(error instanceof Error ? error.message : String(error)),
		}));
	}

	async readResource(serverId: string, uri: string, signal?: AbortSignal): Promise<McpToolCallResult> {
		const entry = this.getServer(serverId);
		if (!entry) throw new Error(`MCP server not found: ${serverId}`);
		if (entry.config.disabled) throw new Error(`MCP server is disabled: ${entry.id}`);
		return this.withInitializedMcpClient(
			entry,
			async (client) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const result = await client.request("resources/read", { uri }, timeoutMs, signal);
				const normalized = this.normalizeMcpContent(
					entry.id,
					"read_resource",
					this.resourceReadResultToToolContent(uri, result),
				);
				return {
					content: normalized.content,
					isError: false,
					details: {
						serverId: entry.id,
						toolName: "resources/read",
						isError: false,
						contentItems: normalized.content.length,
						artifacts: normalized.artifacts.length > 0 ? normalized.artifacts : undefined,
						stderrTail: client.stderrTail || undefined,
					},
				};
			},
			signal,
		);
	}

	async listPrompts(serverId: string, signal?: AbortSignal): Promise<McpPromptListResult> {
		const entry = this.getServer(serverId);
		if (!entry) return { serverId, ok: false, prompts: [], error: "server_not_found" };
		if (entry.config.disabled) return { serverId: entry.id, ok: false, prompts: [], error: "server_disabled" };
		return this.withInitializedMcpClient(
			entry,
			async (client) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const listed = await client.request("prompts/list", {}, timeoutMs, signal);
				const prompts = this.filterPrompts(listed?.prompts);
				return { serverId: entry.id, ok: true, prompts, stderrTail: client.stderrTail || undefined };
			},
			signal,
		).catch((error) => ({
			serverId: entry.id,
			ok: false,
			prompts: [],
			error: redact(error instanceof Error ? error.message : String(error)),
		}));
	}

	async getPrompt(serverId: string, name: string, args?: unknown, signal?: AbortSignal): Promise<McpToolCallResult> {
		const entry = this.getServer(serverId);
		if (!entry) throw new Error(`MCP server not found: ${serverId}`);
		if (entry.config.disabled) throw new Error(`MCP server is disabled: ${entry.id}`);
		return this.withInitializedMcpClient(
			entry,
			async (client) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const result = await client.request(
					"prompts/get",
					{ name, arguments: normalizeToolArgs(args) },
					timeoutMs,
					signal,
				);
				const normalized = this.normalizeMcpContent(
					entry.id,
					"get_prompt",
					this.promptGetResultToToolContent(name, result),
				);
				return {
					content: normalized.content,
					isError: false,
					details: {
						serverId: entry.id,
						toolName: "prompts/get",
						isError: false,
						contentItems: normalized.content.length,
						artifacts: normalized.artifacts.length > 0 ? normalized.artifacts : undefined,
						stderrTail: client.stderrTail || undefined,
					},
				};
			},
			signal,
		);
	}

	createProxyToolDefinitions(): ToolDefinition[] {
		return this.loadServers()
			.filter((entry) => this.shouldExposeTools(entry))
			.flatMap((entry) => {
				const serverId = entry.id;
				const callToolName = createMcpProxyToolName(serverId);
				const listResourcesToolName = createMcpResourceListToolName(serverId);
				const readResourceToolName = createMcpResourceReadToolName(serverId);
				const listPromptsToolName = createMcpPromptListToolName(serverId);
				const getPromptToolName = createMcpPromptGetToolName(serverId);
				return [
					{
						name: callToolName,
						label: `MCP ${serverId}`,
						description: `Call an allowed MCP tool on server '${serverId}'. Use /mcp ${serverId} or repi mcp probe ${serverId} to inspect available tool names.`,
						promptSnippet: `Call MCP server ${serverId} tools`,
						promptGuidelines: [
							`This is a proxy for MCP server '${serverId}'. Pass the original MCP tool name in 'tool'.`,
							"Respect allowedTools/blockedTools from ~/.repi/agent/mcp.json or project .repi/mcp.json.",
						],
						parameters: mcpProxyToolSchema,
						execute: async (_toolCallId, params, signal) => {
							const result = await this.callTool(serverId, params.tool, params.arguments ?? {}, signal);
							return toAgentToolResult(result);
						},
					} satisfies ToolDefinition<typeof mcpProxyToolSchema, McpToolCallDetails>,
					{
						name: listResourcesToolName,
						label: `MCP ${serverId} resources`,
						description: `List MCP resources exposed by server '${serverId}'.`,
						promptSnippet: `List MCP resources from ${serverId}`,
						parameters: mcpResourceListSchema,
						execute: async () => {
							const result = await this.listResources(serverId);
							if (!result.ok) throw new Error(result.error ?? "MCP resources/list failed");
							const text = result.resources.length
								? result.resources
										.map((resource) =>
											[
												`uri=${resource.uri}`,
												resource.name ? `name=${resource.name}` : undefined,
												resource.mimeType ? `mimeType=${resource.mimeType}` : undefined,
												resource.description ? `description=${resource.description}` : undefined,
											]
												.filter(Boolean)
												.join("\n"),
										)
										.join("\n\n")
								: "No MCP resources found.";
							return {
								content: [{ type: "text", text }],
								details: { serverId, toolName: "resources/list", isError: false, contentItems: 1 },
							};
						},
					} satisfies ToolDefinition<typeof mcpResourceListSchema, McpToolCallDetails>,
					{
						name: readResourceToolName,
						label: `MCP ${serverId} read resource`,
						description: `Read an MCP resource URI from server '${serverId}'. Large text is stored as artifact.`,
						promptSnippet: `Read MCP resource from ${serverId}`,
						parameters: mcpResourceReadSchema,
						execute: async (_toolCallId, params, signal) => {
							const result = await this.readResource(serverId, params.uri, signal);
							return toAgentToolResult(result);
						},
					} satisfies ToolDefinition<typeof mcpResourceReadSchema, McpToolCallDetails>,
					{
						name: listPromptsToolName,
						label: `MCP ${serverId} prompts`,
						description: `List MCP prompts exposed by server '${serverId}'.`,
						promptSnippet: `List MCP prompts from ${serverId}`,
						parameters: mcpPromptListSchema,
						execute: async () => {
							const result = await this.listPrompts(serverId);
							if (!result.ok) throw new Error(result.error ?? "MCP prompts/list failed");
							const text = result.prompts.length
								? result.prompts
										.map((prompt) =>
											[
												`name=${prompt.name}`,
												prompt.description ? `description=${prompt.description}` : undefined,
												prompt.arguments ? `arguments=${JSON.stringify(prompt.arguments)}` : undefined,
											]
												.filter(Boolean)
												.join("\n"),
										)
										.join("\n\n")
								: "No MCP prompts found.";
							return {
								content: [{ type: "text", text: inlineMcpText(text) }],
								details: { serverId, toolName: "prompts/list", isError: false, contentItems: 1 },
							};
						},
					} satisfies ToolDefinition<typeof mcpPromptListSchema, McpToolCallDetails>,
					{
						name: getPromptToolName,
						label: `MCP ${serverId} get prompt`,
						description: `Get an MCP prompt by name from server '${serverId}'. Large prompt text is stored as artifact.`,
						promptSnippet: `Get MCP prompt from ${serverId}`,
						parameters: mcpPromptGetSchema,
						execute: async (_toolCallId, params, signal) => {
							const result = await this.getPrompt(serverId, params.name, params.arguments ?? {}, signal);
							return toAgentToolResult(result);
						},
					} satisfies ToolDefinition<typeof mcpPromptGetSchema, McpToolCallDetails>,
				];
			});
	}

	async createToolDefinitions(): Promise<ToolDefinition[]> {
		const definitions: ToolDefinition[] = [];
		const usedNames = new Set(this.createProxyToolDefinitions().map((definition) => definition.name));
		for (const entry of this.loadServers().filter((candidate) => this.shouldExposeTools(candidate))) {
			const probe = await this.probeEntry(entry);
			if (!probe.ok) continue;
			for (const tool of probe.tools) {
				let runtimeName = createMcpToolName(entry.id, tool.name);
				if (usedNames.has(runtimeName)) runtimeName = `${runtimeName}__${shortHash(`${entry.id}/${tool.name}`)}`;
				usedNames.add(runtimeName);
				definitions.push(this.createToolDefinition(entry.id, runtimeName, tool));
			}
		}
		return definitions;
	}

	formatConfig(): string {
		const entries = this.loadServers();
		const lines = ["MCP servers:"];
		lines.push(`config_paths: ${this.configPaths().join(", ")}`);
		if (entries.length === 0) {
			lines.push("- none");
			lines.push(
				'example: create ~/.repi/agent/mcp.json with { "mcpServers": { "demo": { "transport": "stdio", "command": "node", "args": ["server.js"], "autoRegisterTools": true } } }',
			);
			return lines.join("\n");
		}
		for (const entry of entries) {
			const config = redactedConfig(entry.config);
			const transport = normalizeTransport(config);
			const target =
				transport === "stdio" ? [config.command, ...(config.args ?? [])].filter(Boolean).join(" ") : config.url;
			lines.push(
				`- ${entry.id} [${transport}${config.disabled ? ", disabled" : ""}${this.shouldExposeTools(entry) ? ", tools:auto" : ""}] ${target ?? "<missing-target>"}`,
			);
			lines.push(`  source=${entry.sourcePath}`);
		}
		return lines.join("\n");
	}

	formatProbeResults(results: McpProbeResult[]): string {
		const lines = ["MCP probe results:"];
		if (results.length === 0) {
			lines.push("- none");
			return lines.join("\n");
		}
		for (const result of results) {
			lines.push(
				`- ${result.serverId} [${result.ok ? "ok" : "fail"}] transport=${result.transport} tools=${result.tools.length}`,
			);
			if (result.protocolVersion) lines.push(`  protocol=${result.protocolVersion}`);
			if (result.error) lines.push(`  error=${result.error}`);
			for (const tool of result.tools.slice(0, 20))
				lines.push(`  tool: ${tool.name}${tool.description ? ` — ${tool.description}` : ""}`);
			if (result.tools.length > 20) lines.push(`  ... ${result.tools.length - 20} more tools`);
			if (result.stderrTail) lines.push(`  stderr_tail=${result.stderrTail.replace(/\s+/g, " ").slice(-500)}`);
		}
		return lines.join("\n");
	}

	private createToolDefinition(serverId: string, runtimeName: string, tool: McpToolSummary): ToolDefinition {
		return {
			name: runtimeName,
			label: `MCP ${serverId}/${tool.name}`,
			description: tool.description ?? `Call MCP tool '${tool.name}' on server '${serverId}'.`,
			promptSnippet: `Call MCP tool ${serverId}/${tool.name}`,
			promptGuidelines: [
				`Routes to MCP server '${serverId}', original tool '${tool.name}'.`,
				"Use this when the MCP server is the most direct source of truth for the task.",
			],
			parameters: normalizeInputSchema(tool.inputSchema),
			execute: async (_toolCallId, params, signal) => {
				const result = await this.callTool(serverId, tool.name, params, signal);
				return toAgentToolResult(result);
			},
		};
	}

	private filterPrompts(rawPrompts: unknown): McpPromptSummary[] {
		const prompts = Array.isArray(rawPrompts) ? rawPrompts : [];
		return prompts
			.filter((prompt: any) => typeof prompt?.name === "string")
			.map((prompt: any) => ({
				name: prompt.name,
				description: typeof prompt.description === "string" ? prompt.description : undefined,
				arguments: Array.isArray(prompt.arguments) ? prompt.arguments : undefined,
			}));
	}

	private promptGetResultToToolContent(name: string, result: unknown): { content: Array<Record<string, unknown>> } {
		const description = isRecord(result) && typeof result.description === "string" ? result.description : undefined;
		const messages = isRecord(result) && Array.isArray(result.messages) ? result.messages : [];
		const textParts: string[] = [`prompt=${name}`];
		if (description) textParts.push(`description=${description}`);
		const content: Array<Record<string, unknown>> = [];
		for (const [index, message] of messages.entries()) {
			if (!isRecord(message)) continue;
			const role = typeof message.role === "string" ? message.role : "unknown";
			const messageContent = message.content;
			if (isRecord(messageContent) && messageContent.type === "text" && typeof messageContent.text === "string") {
				textParts.push(`\n[${index}] role=${role}\n${messageContent.text}`);
				continue;
			}
			if (
				isRecord(messageContent) &&
				messageContent.type === "image" &&
				typeof messageContent.data === "string" &&
				typeof messageContent.mimeType === "string"
			) {
				content.push({ type: "image", data: messageContent.data, mimeType: messageContent.mimeType });
				textParts.push(`\n[${index}] role=${role}\n[image:${messageContent.mimeType}]`);
				continue;
			}
			textParts.push(`\n[${index}] role=${role}\n${JSON.stringify(messageContent ?? message)}`);
		}
		content.unshift({ type: "text", text: textParts.join("\n") });
		return { content };
	}

	private filterResources(rawResources: unknown): McpResourceSummary[] {
		const resources = Array.isArray(rawResources) ? rawResources : [];
		return resources
			.filter((resource: any) => typeof resource?.uri === "string")
			.map((resource: any) => ({
				uri: resource.uri,
				name: typeof resource.name === "string" ? resource.name : undefined,
				description: typeof resource.description === "string" ? resource.description : undefined,
				mimeType: typeof resource.mimeType === "string" ? resource.mimeType : undefined,
			}));
	}

	private resourceReadResultToToolContent(uri: string, result: unknown): { content: Array<Record<string, unknown>> } {
		const contents = isRecord(result) && Array.isArray(result.contents) ? result.contents : [];
		const content: Array<Record<string, unknown>> = [];
		for (const item of contents) {
			if (!isRecord(item)) continue;
			const itemUri = typeof item.uri === "string" ? item.uri : uri;
			const mimeType = typeof item.mimeType === "string" ? item.mimeType : undefined;
			if (typeof item.text === "string") {
				content.push({
					type: "text",
					text: [`uri=${itemUri}`, mimeType ? `mimeType=${mimeType}` : undefined, "", item.text]
						.filter((part) => part !== undefined)
						.join("\n"),
				});
				continue;
			}
			if (typeof item.blob === "string") {
				if (mimeType?.startsWith("image/")) {
					content.push({ type: "image", data: item.blob, mimeType });
				} else {
					content.push({
						type: "text",
						text: [
							`uri=${itemUri}`,
							mimeType ? `mimeType=${mimeType}` : undefined,
							"encoding=base64",
							"",
							item.blob,
						]
							.filter((part) => part !== undefined)
							.join("\n"),
					});
				}
			}
		}
		return { content };
	}

	private normalizeMcpContent(serverId: string, toolName: string, result: unknown): NormalizedMcpContent {
		const content = isRecord(result) && Array.isArray(result.content) ? result.content : [];
		const normalized: McpToolCallResult["content"] = [];
		const artifacts: McpToolArtifact[] = [];
		for (const [index, item] of content.entries()) {
			if (!isRecord(item)) continue;
			if (item.type === "text" && typeof item.text === "string") {
				const redactedText = redact(item.text);
				if (redactedText.length > MCP_TOOL_ARTIFACT_THRESHOLD_CHARS) {
					const artifact = this.writeTextArtifact(serverId, toolName, index, redactedText);
					artifacts.push(artifact);
					normalized.push({
						type: "text",
						text: `${redactedText.slice(0, MCP_TOOL_INLINE_PREVIEW_CHARS)}

[MCP output stored as artifact]
path=${artifact.path}
sha256=${artifact.sha256}
bytes=${artifact.bytes}
preview_chars=${artifact.previewChars}`,
					});
				} else {
					normalized.push({ type: "text", text: inlineMcpText(redactedText) });
				}
				continue;
			}
			if (item.type === "image" && typeof item.data === "string" && typeof item.mimeType === "string") {
				normalized.push({ type: "image", data: item.data, mimeType: item.mimeType });
				continue;
			}
			normalized.push({ type: "text", text: inlineMcpText(JSON.stringify(item)) });
		}
		if (normalized.length === 0) normalized.push({ type: "text", text: "MCP tool returned no content." });
		return { content: normalized, artifacts };
	}

	private writeTextArtifact(serverId: string, toolName: string, itemIndex: number, text: string): McpToolArtifact {
		const bytes = Buffer.byteLength(text, "utf8");
		const sha256 = createHash("sha256").update(text).digest("hex");
		const dir = join(this.agentDir, "recon", "mcp-artifacts", sanitizeToolNamePart(serverId, "server"));
		mkdirSync(dir, { recursive: true, mode: 0o700 });
		const fileName = `${Date.now()}-${sanitizeToolNamePart(toolName, "tool")}-${itemIndex}-${sha256.slice(0, 12)}.txt`;
		const path = join(dir, fileName);
		writeFileSync(path, text, { encoding: "utf8", mode: 0o600 });
		return { path, sha256, bytes, previewChars: Math.min(MCP_TOOL_INLINE_PREVIEW_CHARS, text.length) };
	}

	private shouldExposeTools(entry: McpServerEntry): boolean {
		return !entry.config.disabled && (entry.config.autoRegisterTools === true || entry.config.enableTools === true);
	}

	private isToolAllowed(entry: McpServerEntry, toolName: string): boolean {
		const allowed = new Set(entry.config.allowedTools ?? []);
		const blocked = new Set(entry.config.blockedTools ?? []);
		return (allowed.size === 0 || allowed.has(toolName)) && !blocked.has(toolName);
	}

	private filterTools(entry: McpServerEntry, rawTools: unknown): McpToolSummary[] {
		const tools = Array.isArray(rawTools) ? rawTools : [];
		return tools
			.filter((tool: any) => typeof tool?.name === "string")
			.filter((tool: any) => this.isToolAllowed(entry, tool.name))
			.map((tool: any) => ({
				name: tool.name,
				description: typeof tool.description === "string" ? tool.description : undefined,
				inputSchema: tool.inputSchema,
			}));
	}

	private async withInitializedMcpClient<T>(
		entry: McpServerEntry,
		callback: (client: McpJsonRpcClient, init: any) => Promise<T>,
		signal?: AbortSignal,
	): Promise<T> {
		const client: McpJsonRpcClient =
			normalizeTransport(entry.config) === "http"
				? new StreamableHttpJsonRpcClient(entry)
				: new StdioJsonRpcClient(entry);
		try {
			const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
			const init = await client.request(
				"initialize",
				{
					protocolVersion: "2025-11-25",
					capabilities: {},
					clientInfo: { name: APP_NAME, version: VERSION },
				},
				timeoutMs,
				signal,
			);
			await client.notify("notifications/initialized", undefined, timeoutMs, signal);
			return await callback(client, init);
		} finally {
			await client.close();
		}
	}

	private async probeEntry(entry: McpServerEntry): Promise<McpProbeResult> {
		const transport = normalizeTransport(entry.config);
		if (entry.config.disabled)
			return { serverId: entry.id, ok: false, transport, tools: [], error: "server_disabled" };

		let stderrTail = "";
		try {
			const result = await this.withInitializedMcpClient(entry, async (client, init) => {
				const timeoutMs = entry.config.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
				const listed = await client.request("tools/list", {}, timeoutMs).catch((error) => ({ error }));
				const tools = this.filterTools(entry, listed?.tools);
				stderrTail = client.stderrTail;
				return {
					serverId: entry.id,
					ok: true,
					transport,
					command:
						transport === "stdio"
							? [entry.config.command, ...(entry.config.args ?? [])].filter(Boolean).join(" ")
							: undefined,
					url: transport === "http" ? entry.config.url : undefined,
					protocolVersion: typeof init?.protocolVersion === "string" ? init.protocolVersion : undefined,
					serverInfo: init?.serverInfo,
					capabilities: init?.capabilities,
					tools,
					stderrTail: client.stderrTail,
				} satisfies McpProbeResult;
			});
			return result;
		} catch (error) {
			return {
				serverId: entry.id,
				ok: false,
				transport,
				command:
					transport === "stdio"
						? [entry.config.command, ...(entry.config.args ?? [])].filter(Boolean).join(" ")
						: undefined,
				url: transport === "http" ? entry.config.url : undefined,
				tools: [],
				stderrTail,
				error: redact(error instanceof Error ? error.message : String(error)),
			};
		}
	}
}

export function createMcpManager(options: McpManagerOptions): McpManager {
	return new McpManager(options);
}
