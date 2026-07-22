#!/usr/bin/env node
/**
 * Child-process web fixture server for reverse host smoke.
 * Usage: node repi-fixture-web-server.mjs browser|authz|js-signing
 * Prints: READY <port>
 */
import { createServer } from "node:http";

const kindArg = String(process.argv[2] || "browser");
const kind = kindArg === "authz" ? "authz" : kindArg === "js-signing" ? "js-signing" : "browser";

// mutable resource for authz rollback CAP
const mutateState = {
	profile: { id: 7, owner: "A", note: "baseline", version: 1 },
};

const JS_SIGNING_SAMPLE = `// secret=repi-dev-secret password=changeme api_key=demo
const crypto = require('crypto');
fetch('/api/sign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Signature': 'deadbeef'
  },
  body: JSON.stringify({ action: 'pay', amount: 1 })
});
function hmac(body, secret) {
  return crypto.createHmac('sha256', secret || 'repi-dev-secret').update(body).digest('hex');
}
//# sourceMappingURL=app.js.map
`;

const server = createServer((req, res) => {
	const url = new URL(req.url || "/", "http://127.0.0.1");
	const cookie = String(req.headers.cookie || "");
	const principal =
		cookie.includes("user=B") || cookie.includes("session=B")
			? "B"
			: cookie.includes("user=A") || cookie.includes("session=A")
				? "A"
				: "anon";

	const setCors = () => {
		res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
		res.setHeader("Access-Control-Allow-Headers", "content-type,authorization,x-csrf-token,cookie");
		res.setHeader("Access-Control-Expose-Headers", "set-cookie,x-request-id");
	};

	if (req.method === "OPTIONS") {
		setCors();
		res.statusCode = 204;
		res.end();
		return;
	}

	if (kind === "js-signing") {
		if (url.pathname === "/app.js" || url.pathname === "/static/app.js") {
			res.setHeader("Content-Type", "application/javascript; charset=utf-8");
			res.statusCode = 200;
			res.end(JS_SIGNING_SAMPLE);
			return;
		}
		if (url.pathname === "/app.js.map" || url.pathname === "/static/app.js.map") {
			res.setHeader("Content-Type", "application/json");
			res.statusCode = 200;
			res.end(
				JSON.stringify({
					version: 3,
					file: "app.js",
					sources: ["app.ts"],
					sourcesContent: ["// secret=repi-dev-secret from sourcemap\nexport const key='repi-dev-secret';\n"],
					mappings: "AAAA",
				}),
			);
			return;
		}
		if (url.pathname === "/api/sign") {
			res.setHeader("Content-Type", "application/json");
			res.statusCode = 200;
			res.end(JSON.stringify({ ok: true, alg: "hmac-sha256", sig: "deadbeef" }));
			return;
		}
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.statusCode = 200;
		res.end(`<!doctype html><html><head><title>REPI JS Signing Smoke</title></head>
<body>
<script src="/app.js" integrity="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" crossorigin="anonymous"></script>
<!-- secret=repi-dev-secret embedded -->
</body></html>`);
		return;
	}

	if (kind === "browser") {
		if (url.pathname === "/app.js") {
			res.setHeader("Content-Type", "application/javascript");
			res.end(
				"try{localStorage.setItem('repi_browser_smoke','1');sessionStorage.setItem('repi_session','pwsmoke');}catch(e){}\n" +
				"try{const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');ws.onopen=()=>ws.send('ping');}catch(e){}\n" +
				"fetch('/api/users/1');\n//# sourceMappingURL=app.js.map\n",
			);
			return;
		}
		if (url.pathname === "/app.js.map") {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ version: 3, file: "app.js", sources: ["app.ts"], mappings: "AAAA" }));
			return;
		}
		if (url.pathname === "/api/users/1") {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ id: 1, user: "pwsmoke" }));
			return;
		}
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.setHeader("Set-Cookie", ["session=pwsmoke; Path=/; SameSite=Lax", "repi_sid=fixture; Path=/; HttpOnly; SameSite=Strict"]);
		res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; connect-src 'self' ws: wss:");
		res.setHeader("X-Frame-Options", "DENY");
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.setHeader("Referrer-Policy", "no-referrer");
		res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
		res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
		res.end(`<!doctype html><html><head>
<meta name="Content-Security-Policy" content="default-src 'self'">
<title>REPI Browser Smoke</title>
</head><body>
<form method="post" action="/api/login"><input name="user"><input name="pass" type="password"></form>
<a href="/api/users/1">users</a>
<script src="/app.js" integrity="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" crossorigin="anonymous"></script>
</body></html>`);
		return;
	}

	if (url.pathname === "/ws") {
		// HTTP probe path; real WS upgrade not required for CAP (playwright probes + page inline WS)
		res.statusCode = 400;
		res.setHeader("Content-Type", "text/plain");
		res.end("websocket endpoint (upgrade required)");
		return;
	}

	// authz fixture
	setCors();
	if (url.pathname === "/api/profile" || url.pathname === "/api/mutate") {
		// mutable resource for rollback CAP
		if (req.method === "GET" || req.method === "HEAD") {
			res.setHeader("Content-Type", "application/json");
			if (principal !== "anon") res.setHeader("Set-Cookie", `session=${principal}; Path=/`);
			if (req.method === "HEAD") {
				res.end();
				return;
			}
			res.end(JSON.stringify({ ...mutateState.profile, principal }));
			return;
		}
		if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
			let body = "";
			req.on("data", (c) => {
				body += c;
				if (body.length > 1e6) req.destroy();
			});
			req.on("end", () => {
				try {
					const parsed = body ? JSON.parse(body) : {};
					if (parsed && typeof parsed === "object") {
						const prev = { ...mutateState.profile };
						const next = { ...mutateState.profile, ...parsed };
						// Preserve/restore version when client supplies it; else bump only on content change.
						const { version: _pv, principal: _pp, ...prevCore } = prev;
						const { version: _nv, principal: _np, ...nextCore } = next;
						const contentChanged = JSON.stringify(prevCore) !== JSON.stringify(nextCore);
						if (Object.prototype.hasOwnProperty.call(parsed, "version")) {
							next.version = Number(parsed.version);
						} else if (contentChanged) {
							next.version = Number(prev.version || 1) + 1;
						} else {
							next.version = Number(prev.version || 1);
						}
						mutateState.profile = next;
					}
				} catch {
					mutateState.profile = {
						...mutateState.profile,
						note: body.slice(0, 200) || "mutated",
						version: Number(mutateState.profile.version || 1) + 1,
					};
				}
				res.setHeader("Content-Type", "application/json");
				if (principal !== "anon") res.setHeader("Set-Cookie", `session=${principal}; Path=/`);
				res.end(JSON.stringify({ ok: true, profile: mutateState.profile, principal }));
			});
			return;
		}
	}
	if (url.pathname === "/api/users/1" || url.pathname.startsWith("/api/users/")) {
		const body =
			principal === "A"
				? JSON.stringify({ id: 1, owner: "A", secret: "a-data" })
				: principal === "B"
					? JSON.stringify({ id: 1, owner: "B", secret: "b-data" })
					: JSON.stringify({ id: 1, owner: "anon", public: true });
		if (principal !== "anon") res.setHeader("Set-Cookie", `session=${principal}; Path=/`);
		res.setHeader("Content-Type", "application/json");
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		res.end(body);
		return;
	}

	const page =
		principal === "A"
			? "authz-home principal=A cookie-session"
			: principal === "B"
				? "authz-home principal=B cookie-session"
				: "authz-home principal=anon public";
	res.setHeader("Content-Type", "text/plain");
	res.setHeader("Set-Cookie", principal === "anon" ? "guest=1; Path=/" : `session=${principal}; Path=/`);
	if (req.method === "HEAD") {
		res.end();
		return;
	}
	if (req.method === "POST") {
		res.end(JSON.stringify({ ok: true, principal, origin: req.headers.origin || null }));
		return;
	}
	res.end(page);
});

server.listen(0, "127.0.0.1", () => {
	const addr = server.address();
	const port = typeof addr === "object" && addr ? addr.port : 0;
	process.stdout.write(`READY ${port}\n`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
