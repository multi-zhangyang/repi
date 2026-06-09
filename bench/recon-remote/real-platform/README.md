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
| `bilibili-video` | Extract BV/cid, call view/pagelist/playurl, rebuild WBI `w_rid` from `nav.wbi_img`, call signed `x/player/wbi/playurl`, classify DASH/durl candidates, probe CDN media URLs with HEAD/range, emit media probe matrix and deterministic WBI signer self-test. With `RECON_BROWSER=1` or `RECON_BILI_CDP=1`, also captures Chrome/CDP runtime, browser-emitted WBI signed requests, signer stack events, external JS bundle hints, and buvid/media URL runtime drift. |
| `xiaohongshu-note` | Chrome/CDP runtime capture, extract note IDs, `/api/sns/web/*` hints, xsec/signature/anti-bot signals, rendered state/response bodies, signer bundle snippets, signed request timeline, runtime signer events, replay a ranked ladder of captured read-only signed API requests with no-cookie and exact-cookie variants, classify signed 2xx web replay vs note 461 verification challenge, and emit first-divergence evidence. |
| `generic-cdp` | Chrome/CDP request/response/body/storage baseline and generic signature/header bundle trace for unknown platforms. |

`--self-test` validates the embedded Bilibili WBI mixin table, signing normalizer, query ordering and deterministic `w_rid` hash without network access.

Bilibili browser trace example:

```bash
RECON_BROWSER=1 RECON_PROBE_LIMIT=4 \
  node bench/recon-remote/real-platform/run.mjs https://www.bilibili.com/video/BV1odL76QE6B bilibili-video
```

## Output

```text
.pi/evidence/remote/real-platform/<profile>/<host>/<timestamp>/
artifact.md
result.json
browser.json       # CDP profiles
browser.html       # when rendered HTML is available
```


## Bilibili runtime frontier evidence

The Bilibili profile does not stop at offline `w_rid` reconstruction. In browser mode it injects fetch/XHR/header/storage/cookie/crypto hooks, observes real player WBI requests such as `x/player/wbi/playurl`, records signer stack anchors from loaded player bundles, and fetches referenced JS bundles for signer-term snippets. This is the evidence consumed by `frontier-gate` for `bilibili_runtime_wbi_bundle_trace`.


## Xiaohongshu replay ladder

The Xiaohongshu profile ranks captured read-only `/api/sns/web/*` and `/api/sns/h5/*` GET requests by endpoint class, signed header coverage, observed status, and response shape. For each selected seed it replays both `no-cookie` and `exact-cookie` variants, using CDP `Network.getAllCookies` internally while redacting cookie values in artifacts. The output records `best2xxSignedReplay`, `bestNote2xxSignedReplay`, and `firstDivergence` so frontier-gate can distinguish generic signed 2xx web replay from the harder note-data 2xx requirement.
