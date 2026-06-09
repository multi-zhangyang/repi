# Quickstart

This page gets you from install to a useful first repi session.

## Install

REPI is distributed as an npm package:

```bash
npm install -g --ignore-scripts @pi-recon/repi-coding-agent
```

`--ignore-scripts` disables dependency lifecycle scripts during install. REPI does not require install scripts for normal npm installs.

### Uninstall

Use the package manager that installed repi. The curl installer uses npm globally, so curl and npm installs are removed with npm:

```bash
# curl installer or npm install -g
npm uninstall -g @pi-recon/repi-coding-agent

# pnpm
pnpm remove -g @pi-recon/repi-coding-agent

# Yarn
yarn global remove @pi-recon/repi-coding-agent

# Bun
bun uninstall -g @pi-recon/repi-coding-agent
```

Uninstalling repi leaves settings, credentials, sessions, and installed repi packages in `~/.repi/agent/`.

Then start repi in the project directory you want it to work on:

```bash
cd /path/to/project
repi
```

## Authenticate

REPI can use subscription providers through `/login`, or API-key providers through environment variables or the auth file.

### Option 1: subscription login

Start repi and run:

```text
/login
```

Then select a provider. Built-in subscription logins include Claude Pro/Max, ChatGPT Plus/Pro (Codex), and GitHub Copilot.

### Option 2: API key

Set an API key before launching repi:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
repi
```

You can also run `/login` and select an API-key provider to store the key in `~/.repi/agent/auth.json`.

See [Providers](providers.md) for all supported providers, environment variables, and cloud-provider setup.

## First session

Once repi starts, type a request and press Enter:

```text
Summarize this repository and tell me how to run its checks.
```

By default, repi gives the model four tools:

- `read` - read files
- `write` - create or overwrite files
- `edit` - patch files
- `bash` - run shell commands

Additional built-in read-only tools (`grep`, `find`, `ls`) are available through tool options. REPI runs in your current working directory and can modify files there. Use git or another checkpointing workflow if you want easy rollback.

## Give repi project instructions

REPI loads context files at startup. Add an `AGENTS.md` file to tell it how to work in a project:

```markdown
# Project Instructions

- Run `npm run check` after code changes.
- Do not run production migrations locally.
- Keep responses concise.
```

REPI loads:

- `~/.repi/agent/AGENTS.md` for global instructions
- `AGENTS.md` or `CLAUDE.md` from parent directories and the current directory

Restart repi, or run `/reload`, after changing context files.

## Common things to try

### Reference files

Type `@` in the editor to fuzzy-search files, or pass files on the command line:

```bash
repi @README.md "Summarize this"
repi @src/app.ts @src/app.test.ts "Review these together"
```

Images can be pasted with Ctrl+V (Alt+V on Windows) or dragged into supported terminals.

### Run shell commands

In interactive mode:

```text
!npm run lint
```

The command output is sent to the model. Use `!!command` to run a command without adding its output to the model context.

### Switch models

Use `/model` or Ctrl+L to choose a model. Use Shift+Tab to cycle thinking level. Use Ctrl+P / Shift+Ctrl+P to cycle through scoped models.

### Continue later

Sessions are saved automatically:

```bash
repi -c                  # Continue most recent session
repi -r                  # Browse previous sessions
repi --name "my task"    # Set session display name at startup
repi --session <path|id> # Open a specific session
```

Inside repi, use `/resume`, `/new`, `/tree`, `/fork`, and `/clone` to manage sessions.

### Non-interactive mode

For one-shot prompts:

```bash
repi -p "Summarize this codebase"
cat README.md | repi -p "Summarize this text"
repi -p @screenshot.png "What's in this image?"
```

Use `--mode json` for JSON event output or `--mode rpc` for process integration.

## Next steps

- [Using REPI](usage.md) - interactive mode, slash commands, sessions, context files, and CLI reference.
- [Providers](providers.md) - authentication and model setup.
- [Settings](settings.md) - global and project configuration.
- [Keybindings](keybindings.md) - shortcuts and customization.
- [REPI Packages](packages.md) - install shared extensions, skills, prompts, and themes.

Platform notes: [Windows](windows.md), [Termux](termux.md), [tmux](tmux.md), [Terminal setup](terminal-setup.md), [Shell aliases](shell-aliases.md).
