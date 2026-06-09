# Frontier orchestrator

Lightweight dogfood orchestration for the real-platform frontier matrix. It does not change `frontier-matrix/run.mjs` and does not create a separate evidence tree; execution is delegated to `frontier-matrix`, then this runner compacts the resulting positive/negative evidence for agents.

## Usage

Plan only, no evidence writes:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --plan --shards=3
```

Run the hardest selected matrix cases and summarize:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --live --strict
```

Reject stale latest-evidence artifacts during a non-live merge:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --strict --fresh
```

Compact the latest matrix artifact without rerunning browsers:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --summarize-latest
```

JSON output for another agent or CI wrapper:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --summarize-latest --json
```

## Selection strategies

| Strategy | Behavior |
|---|---|
| `hardest` | Default. Sorts known matrix cases by difficulty and preserves negative-control coverage when truncating. |
| `failed-first` | Reads the latest matrix result, prioritizes failed cases, then fills with hardest cases. |
| `balanced` | Keeps Bilibili, Xiaohongshu, Douyin, and the XHS negative-control boundary represented. |
| `quick` | Runs the tight XHS pair: auto-discovery positive plus search negative-control. |

Explicit case override:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs \
  --cases=xhs_auto_discovery,xhs_search_negative --live --strict
```

## Multi-agent and context management

Use `--shards=N` in plan mode to hand independent case groups to parallel agents:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --plan --live --strict --shards=3
```

Each shard command is a normal `frontier-matrix` invocation with `RECON_MATRIX_CASES=<ids>`. The final merge step can then run:

```bash
node bench/recon-remote/frontier-orchestrator/run.mjs --summarize-latest
```

Current catalog tracks Bilibili runtime WBI, Bilibili signed media/CDN boundary,
Bilibili multi-page WBI container, XHS auto-discovery, XHS discovery hit-rate,
XHS search negative-control, Douyin structured API replay, and Douyin
cookie-boundary replay divergence.

The summary intentionally keeps only compact context:

- one decisive evidence line per case;
- positive replay samples separated from negative controls;
- concrete `result.json` artifact paths;
- failed-case next actions with rerun commands.
- freshness status so stale latest-evidence runs do not look like current
  capability.

This makes compacting easier: agents do not need to carry full browser stdout/stderr, raw request bodies, or historical matrix logs in context.
