# Remote live benchmarks

Reproducible public-network benchmark harnesses for Pi-RECON. Runtime evidence is written under `.pi/evidence/remote/` and is git-ignored.

| Benchmark | Purpose |
|---|---|
| `douyin-nowatermark/` | Short-video media URL reverse analysis: redirect/CDP/state extraction, `playwm -> play` no-watermark candidate transform, HEAD/range verification. |
| `public-webapp/` | Public webapp surface mapping and replay-safe vulnerability confirmation for profiles such as OWASP Juice Shop and Altoro Mutual/TestFire. |

Run each benchmark with `node <benchmark>/run.mjs --help` for usage.
