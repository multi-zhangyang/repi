# REPI runtime configuration

REPI uses its own runtime files and does not read/write the normal `pi` profile by default.

| Purpose | Path |
|---|---|
| Custom providers/models | `~/.repi/agent/models.json` |
| Default model and compact policy | `~/.repi/agent/settings.json` |
| OAuth/API-key login state | `~/.repi/agent/auth.json` |
| REPI evidence/memory/mission | `~/.repi/agent/recon/` |

## OpenAI-compatible example

```json
{
  "providers": {
    "openai-compatible": {
      "baseUrl": "https://api.example.com/v1",
      "api": "openai-completions",
      "apiKey": "$OPENAI_COMPAT_API_KEY",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false,
        "supportsStore": false,
        "supportsStrictMode": false,
        "maxTokensField": "max_tokens"
      },
      "models": [
        {
          "id": "provider/model-id",
          "name": "Provider Model",
          "contextWindow": 128000,
          "maxTokens": 16384,
          "input": ["text"]
        }
      ]
    }
  }
}
```

```bash
export OPENAI_COMPAT_API_KEY=<your-token>
repi --list-models
repi --provider openai-compatible --model provider/model-id
```

## Anthropic-compatible example

```json
{
  "providers": {
    "anthropic-compatible": {
      "baseUrl": "https://api.anthropic.com",
      "api": "anthropic-messages",
      "apiKey": "$ANTHROPIC_API_KEY",
      "models": [
        {
          "id": "claude-sonnet-4-5",
          "name": "Claude Sonnet",
          "contextWindow": 200000,
          "maxTokens": 8192,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

If a gateway exposes `/v1/chat/completions`, use `api: "openai-completions"` even when it routes to an Anthropic-family model upstream.

## Default model

`~/.repi/agent/settings.json`:

```json
{
  "defaultProvider": "openai-compatible",
  "defaultModel": "provider/model-id",
  "defaultThinkingLevel": "high"
}
```

Or specify per launch:

```bash
repi --provider openai-compatible --model provider/model-id
```

## Auto compact

REPI defaults:

```json
{
  "compaction": {
    "enabled": true,
    "triggerPercent": 85,
    "warningPercent": 80,
    "reserveTokens": 16384,
    "keepRecentTokens": 36000
  }
}
```

Trigger threshold:

```text
min(contextWindow * triggerPercent / 100, contextWindow - reserveTokens)
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No models match pattern` | Make sure provider id and model id exactly match `models.json`. |
| `No API key found` | Export the env var referenced by `apiKey`, or run `/login` for a built-in provider. |
| Upstream rejects `developer` role | Set `"supportsDeveloperRole": false`. |
| Upstream rejects `reasoning_effort` | Set `"supportsReasoningEffort": false`. |
| Upstream rejects `store` or tool strict mode | Set `"supportsStore": false` and `"supportsStrictMode": false`. |
