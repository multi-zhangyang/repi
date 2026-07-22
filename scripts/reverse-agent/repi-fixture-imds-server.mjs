#!/usr/bin/env node
/**
 * Local IMDS-like fixture server for reverse-smoke cloud CAP.
 * Prints: READY <port>
 *
 * Endpoints (subset, no secrets/tokens dumped):
 *  GET /latest/meta-data/                 -> 200 "repi-imds-mock\n"
 *  GET /latest/meta-data/iam/security-credentials/ -> 200 "repi-mock-role\n"
 *  GET /metadata/instance?...             -> 200 JSON (azure-ish)
 *  GET /computeMetadata/v1/               -> 200 "repi-gcp-mock\n"
 */
import http from "node:http";

const server = http.createServer((req, res) => {
	const url = req.url || "/";
	const path = url.split("?")[0];
	// optional header checks for azure/gcp flavor (do not reject missing for smoke)
	// IMDSv2 session token (fixture marker only — not a real AWS token)
	if (path === "/latest/api/token") {
		if (String(req.method || "GET").toUpperCase() === "PUT") {
			const ttl = req.headers["x-aws-ec2-metadata-token-ttl-seconds"] || "21600";
			res.writeHead(200, {
				"content-type": "text/plain",
				"x-aws-ec2-metadata-token-ttl-seconds": String(ttl),
			});
			res.end("repi-imdsv2-fixture-token\n");
			return;
		}
		res.writeHead(405, { "content-type": "text/plain" });
		res.end("method-not-allowed\n");
		return;
	}
	if (path === "/latest/meta-data/" || path === "/latest/meta-data") {
		const tok = req.headers["x-aws-ec2-metadata-token"];
		// accept with or without token for smoke compatibility; annotate path
		res.writeHead(200, {
			"content-type": "text/plain",
			"x-repi-imds-token-present": tok ? "1" : "0",
		});
		res.end("repi-imds-mock\nami-id\nhostname\niam/\n");
		return;
	}
	if (path.startsWith("/latest/meta-data/iam/security-credentials")) {
		// List role name only — no credential body
		res.writeHead(200, { "content-type": "text/plain" });
		res.end("repi-mock-role\n");
		return;
	}
	if (path.startsWith("/metadata/instance")) {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(
			JSON.stringify({
				compute: { name: "repi-azure-mock", location: "eastus" },
				note: "fixture-no-secrets",
			}),
		);
		return;
	}
	if (path.startsWith("/computeMetadata/v1")) {
		res.writeHead(200, { "content-type": "text/plain" });
		res.end("repi-gcp-mock\n");
		return;
	}
	if (path === "/" || path === "/health") {
		res.writeHead(200, { "content-type": "text/plain" });
		res.end("ok\n");
		return;
	}
	res.writeHead(404, { "content-type": "text/plain" });
	res.end("not-found\n");
});

server.listen(0, "127.0.0.1", () => {
	const addr = server.address();
	const port = typeof addr === "object" && addr ? addr.port : 0;
	process.stdout.write(`READY ${port}\n`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
