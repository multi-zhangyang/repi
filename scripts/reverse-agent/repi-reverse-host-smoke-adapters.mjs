/**
 * Adapter-domain host CAP runners for reverse-smoke.
 * Imported by repi-reverse-host-smoke.mjs.
 */
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const PATH_PREFIX = "/usr/local/bin:/usr/bin:/bin:/opt/repi-tools/rizin:/opt/jadx/bin:/root/.local/bin";

function shQuote(value) {
	return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function ensureFixtures(root) {
	const script = join(root, "scripts/reverse-agent/repi-reverse-host-smoke-fixtures.py");
	const r = spawnSync("python3", [script], { encoding: "utf8" });
	if (r.status !== 0) {
		// non-fatal
	}
}

function runBash(cmd, timeoutMs = 120000, extraEnv = {}) {
	// Write to a temp script to avoid spawn argv null-byte / length issues in large templates.
	const scriptPath = `/tmp/repi-adapter-run-${process.pid}-${Date.now()}.sh`;
	writeFileSync(scriptPath, `#!/usr/bin/env bash\nset +e\n${cmd}\n`);
	const r = spawnSync("bash", ["--noprofile", "--norc", scriptPath], {
		encoding: "utf8",
		timeout: timeoutMs,
		maxBuffer: 40 * 1024 * 1024,
		env: {
			...process.env,
			PATH: PATH_PREFIX,
			...extraEnv,
		},
	});
	try {
		unlinkSync(scriptPath);
	} catch {
		// ignore
	}
	return {
		status: r.status === null ? 1 : r.status,
		out: `${r.stdout || ""}\n${r.stderr || ""}`,
	};
}

function materialize(template, target) {
	// Prefer explicit target env + $1; only strip adapter-name prefix when present.
	const first = template.split("\n", 1)[0] || "";
	let body = template;
	if (/^[A-Za-z0-9._-]+-runner[^:]*:\s/.test(first) || /^adapter-[A-Za-z0-9._-]+:\s/.test(first)) {
		body = template.replace(/^[^:]+:\s*/, "");
	}
	body = body.replaceAll("<target>", shQuote(target));
	return `target=${shQuote(target)}; set -- ${shQuote(target)};\n${body}`;
}

async function loadTemplates(root) {
	const base = join(root, "packages/coding-agent/src/core/repi/runtime-adapter/command-templates");
	const [
		{ pcapFallbackCommandTemplate },
		{ malwareStaticIocCommandTemplate },
		{ cryptoParamTransformCommandTemplate },
		{ memoryForensicsHostCommandTemplate },
		{ cloudIdentityHostCommandTemplate },
		{ agentSecurityBoundaryCommandTemplate },
		{ rootfsServiceMapCommandTemplate },
	] = await Promise.all([
		import(join(base, "dfir.ts")),
		import(join(base, "malware.ts")),
		import(join(base, "crypto.ts")),
		import(join(base, "memory-forensics.ts")),
		import(join(base, "cloud-identity.ts")),
		import(join(base, "agent-security.ts")),
		import(join(base, "firmware.ts")),
	]);
	return {
		dfir: () => pcapFallbackCommandTemplate(),
		malware: () => malwareStaticIocCommandTemplate("native"),
		crypto: () => cryptoParamTransformCommandTemplate("native"),
		memory: () => memoryForensicsHostCommandTemplate("native"),
		cloud: () => cloudIdentityHostCommandTemplate("native"),
		agent: () => agentSecurityBoundaryCommandTemplate("native"),
		firmware: () => rootfsServiceMapCommandTemplate("native"),
	};
}

function row(id, status, out, path, checks, tags = {}) {
	return {
		id,
		ok: Object.values(checks).every(Boolean),
		path,
		bytes: out.length,
		exit: status,
		checks,
		tags,
	};
}


function startImdsFixture(rootPath) {
	const scriptPath = join(rootPath, "scripts/reverse-agent/repi-fixture-imds-server.mjs");
	const child = spawn(process.execPath, [scriptPath], {
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, PATH: PATH_PREFIX },
	});
	return new Promise((resolveServer, reject) => {
		let buf = "";
		let done = false;
		const timer = setTimeout(() => {
			if (done) return;
			try { child.kill("SIGTERM"); } catch {}
			reject(new Error("imds fixture timeout"));
		}, 10000);
		const finish = (port) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolveServer({
				baseUrl: `http://127.0.0.1:${port}`,
				close: async () => {
					try { child.kill("SIGTERM"); } catch {}
					await new Promise((r) => setTimeout(r, 50));
				},
			});
		};
		child.stdout.on("data", (chunk) => {
			buf += String(chunk);
			const match = /READY (\d+)/.exec(buf);
			if (match) finish(Number(match[1]));
		});
		child.stderr.on("data", () => {});
		child.on("error", (err) => {
			if (done) return;
			clearTimeout(timer);
			reject(err);
		});
	});
}

export async function runAdapterDomains(root, _docs, selected, writeSmoke) {
	ensureFixtures(root);
	const templates = await loadTemplates(root);
	const rows = [];

	const specs = [
		{
			id: "dfir",
			smoke: "dfir",
			target: "/tmp/repi-dfir-smoke.pcap",
			template: templates.dfir,
			checks: (out) => ({
				pcap: /\[pcap-file\]|\[dfir-pcap|packets=/.test(out),
				flow: /\[flow-conversation\]|\[pcap-flow\]|flows=/.test(out),
				dns: /\[dfir-tshark-dns\]|dns\.qry|example\.com|dns=1/.test(out),
				http: /\[dfir-tshark-http\]|\[http-object\]|api\.example\.com|Authorization|http=1/.test(out),
				tls_sni: /\[dfir-tshark-sni\]|cdn\.example\.com|tls=1|tls\.handshake/.test(out),
				l2_l3: /\[dfir-tshark-arp\]|\[dfir-tshark-icmp\]|\[dfir-tshark-dhcp\]|arp=1|icmp=1|dhcp=1/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "firmware",
			smoke: "firmware",
			// Prefer rootfs dir (+ nested image) so dir_probe + rootfs-binary needles light up.
			target: "/tmp/repi-firmware-rootfs-dir",
			extraTargets: ["/tmp/repi-firmware-image.bin"],
			template: templates.firmware,
			checks: (out) => ({
				binwalk_or_map: /\[firmware-binwalk\]|\[firmware-image\]|pure_python_map=1|squashfs|service|rootfs-/.test(out),
				rootfs_binary: /\[rootfs-binary\]/.test(out),
				dir_or_extract: /dir_probe=1|extract=1|\[rootfs-account\]/.test(out),
				version_or_service: /\[firmware-version\] hits=[1-9]|\[firmware-service-map\] hits=[1-9]|BusyBox v|OpenWrt/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "crypto",
			smoke: "crypto",
			target: "/tmp/repi-crypto-smoke.bin",
			template: templates.crypto,
			checks: (out) => ({
				param: /\[crypto-param\].*inventory_ok=1|inventory_ok=1/.test(out),
				transform: /\[crypto-transform\]/.test(out),
				xor_or_classical: /\[crypto-xor\] hits=[1-9]|\[crypto-classical\] hits=[1-9]|summary\.crypto_xor=1|summary\.crypto_classical=1/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "malware",
			smoke: "malware",
			target: "/tmp/repi-malware-sample.pe",
			template: templates.malware,
			checks: (out) => ({
				static: /\[malware-static\]|static_triage=1/.test(out),
				ioc: /\[malware-ioc\]|evil\.example|c2/.test(out),
				xor_hits: /\[malware-xor\] pure_python=1 hits=[1-9]|\[malware-xor\] key=0x/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "memory",
			smoke: "memory",
			target: "/tmp/repi-mem-smoke.bin",
			template: templates.memory,
			checks: (out) => ({
				image: /\[mem-image\]/.test(out),
				process: /\[mem-process\]|lsass|powershell/.test(out),
				yara_or_vol: /\[mem-yara-host\] ok=1|\[mem-vol\] ok=1|summary\.mem_yara=1|summary\.mem_vol=1/.test(out),
				path_or_iso: /path_hits=[1-9]|iso_hits=[1-9]|summary\.mem_path=1|summary\.mem_iso=1|C:\\Windows\\/.test(out),
				pslist_surrogate: /\[mem-pslist-surrogate\] windows_pslist=1|summary\.mem_windows_pslist_surrogate=1|\[mem-pslist\] unique=[1-9]/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "cloud",
			smoke: "cloud",
			target: root,
			template: templates.cloud,
			extraEnv: { KUBECONFIG: "/tmp/repi-kubeconfig", REPI_K8S_SA_DIR: "/tmp/repi-k8s-sa", REPI_AWS_STS_FIXTURE: "/tmp/repi-aws-sts-fixture.json" },
			useImdsMock: true,
			checks: (out) => ({
				inventory: /\[cloud-identity\] inventory_ok=1|inventory_ok=1/.test(out),
				host: /\[cloud-host\]|docker_sock|kubectl|aws=/.test(out),
				kubeconfig: /\[cloud-kubectl\] config_ok=1|\[cloud-kubeconfig\] present=1|config=.*present=1/.test(out),
				k8s_sa: /\[cloud-k8s-sa\] ok=1|summary\.cloud_k8s_sa=1|namespace=repi-smoke/.test(out),
				imds_mock: /\[cloud-imds-http\] ok=1 mock=1|summary\.cloud_imds_mock=1|mock_base=/.test(out),
				sts_fixture: /\[cloud-aws-sts\] ok=1 fixture=1|summary\.cloud_aws_sts_fixture=1|account=123456789012/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
		{
			id: "agent-security",
			smoke: "agent-security",
			target: root,
			template: templates.agent,
			checks: (out) => ({
				prompt_or_tool: /\[agent-prompt\]|\[agent-host\]|\[agent-tool\]|\[agent-security/.test(out),
				proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
				bind_ready: /bind_ready=true/.test(out),
			}),
		},
	];

	for (const spec of specs) {
		if (!selected.has(spec.id) && !selected.has(spec.smoke)) continue;
		const targets = [spec.target, ...(spec.extraTargets || [])].filter(Boolean);
		let out = "";
		let status = 0;
		let imds = null;
		try {
			if (spec.useImdsMock) {
				imds = await startImdsFixture(root);
			}
			const env = { ...(spec.extraEnv || {}) };
			if (imds?.baseUrl) env.REPI_IMDS_BASE_URL = imds.baseUrl;
			for (const target of targets) {
				const cmd = materialize(spec.template(), target).replace(/\u0000/g, "");
				const result = runBash(cmd, 180000, env);
				out += `\n==== TARGET ${target} ====\n` + result.out;
				if (result.status !== 0) status = result.status;
			}
		} finally {
			if (imds) await imds.close();
		}
		const path = writeSmoke(spec.smoke, out);
		const checks = spec.checks(out);
		rows.push(
			row(spec.smoke, status, out, path, checks, {
				proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
			}),
		);
	}
	return rows;
}

export const ADAPTER_SCOPE_IDS = [
	"dfir",
	"firmware",
	"crypto",
	"malware",
	"memory",
	"cloud",
	"agent-security",
];
