# Remote live benchmarks

Reproducible public-network benchmark harnesses for Pi-RECON. Runtime evidence is written under `.pi/evidence/remote/` and is git-ignored.

| Benchmark | Purpose |
|---|---|
| `douyin-nowatermark/` | Short-video media URL reverse analysis: redirect/CDP/state extraction, `playwm -> play` no-watermark candidate transform, `a_bogus`/`msToken`/webid anti-bot surface inventory, signer-bundle hints, HEAD/range verification. |
| `public-webapp/` | Public webapp surface mapping and replay-safe vulnerability confirmation for profiles such as OWASP Juice Shop and Altoro Mutual/TestFire. |
| `real-platform/` | Hard-mode real-platform reverse benchmark for Bilibili WBI/media APIs/CDN probes/self-test regression and Xiaohongshu CDP anti-bot/API signed replay, signer-bundle trace, replay-divergence capture. |

Run each benchmark with `node <benchmark>/run.mjs --help` for usage.

## Hard-score evaluator

After running any remote benchmark, generate a cross-platform scoreboard:

```bash
node bench/recon-remote/hard-score.mjs
```

The evaluator scores latest artifacts across `signature_rebuild`, `signed_replay`, `anti_bot_challenge`, `cdn_media_probe`, `runtime_capture_depth`, `exploit_chain`, `bundle_trace`, and `regression_readiness`, writing:

```text
.pi/evidence/remote/hard-score/<timestamp>/scoreboard.{json,md}
```
