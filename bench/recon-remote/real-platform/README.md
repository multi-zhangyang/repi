# Real platform hard benchmark

High-difficulty public-network reverse benchmark for real platforms. It focuses on runtime truth: public page state, API replay, signed/ephemeral media URLs, CDN probes, anti-bot/header surfaces, and browser/CDP evidence.

## Usage

```bash
node bench/recon-remote/real-platform/run.mjs https://www.bilibili.com/video/BV1odL76QE6B bilibili-video
node bench/recon-remote/real-platform/run.mjs 'https://www.xiaohongshu.com/explore/66237c6e000000001c00893f' xiaohongshu-note
node bench/recon-remote/real-platform/run.mjs --self-test
```

Profiles:

| Profile | Chain |
|---|---|
| `bilibili-video` | Extract BV/cid, call view/pagelist/playurl, rebuild WBI `w_rid` from `nav.wbi_img`, call signed `x/player/wbi/playurl`, classify DASH/durl candidates, probe CDN media URLs with HEAD/range, emit media probe matrix and deterministic WBI signer self-test. |
| `xiaohongshu-note` | Chrome/CDP runtime capture, extract note IDs, `/api/sns/web/*` hints, xsec/signature/anti-bot signals, rendered state/response bodies, signer bundle snippets, signed request timeline, replay one captured read-only signed API request and classify 2xx success vs 461 verification challenge plus replay divergence. |
| `generic-cdp` | Chrome/CDP request/response/body/storage baseline and generic signature/header bundle trace for unknown platforms. |

`--self-test` validates the embedded Bilibili WBI mixin table, signing normalizer, query ordering and deterministic `w_rid` hash without network access.

## Output

```text
.pi/evidence/remote/real-platform/<profile>/<host>/<timestamp>/
artifact.md
result.json
browser.json       # CDP profiles
browser.html       # when rendered HTML is available
```
