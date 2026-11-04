# DSH Agent Roles

[中文](README.md) · [Changelog](CHANGELOG.md) · [Release guide](docs/RELEASING.md)

Role management for **DeepSeek Harness Web 0.2.1-rc.5**, built on native Agent Teams.

## Features

- A sidebar panel for creating, editing, enabling and deleting roles.
- Per-role selection from configured DSH models, reasoning effort, literal role prompts and tool allowlists.
- Searchable Skills selection, empty by default. Selected skill bodies are loaded when a new member starts; they do not grant additional tools.
- Native background members, result delivery, session navigation and follow-up messages.
- Immutable launch snapshots and request-level evidence for the selected model, tools, role prompt and skills.

A fresh installation starts with **no roles**. It does not ship the author’s prompts, provider configuration or conversation records. Existing local role data is preserved on upgrade.

## Install

Requires Node.js 22.18+, DSH Web **0.2.1-rc.5**, and a configured model provider. This release declares compatibility with that exact DSH version; Agent Team APIs are experimental.

```sh
dsh plugin --profile web add dsh-agent-roles
```

Alternatively, install the prebuilt release archive:

```sh
dsh plugin --profile web add https://github.com/Delthin/dsh-agent-roles/releases/download/v0.3.0/dsh-agent-roles-0.3.0.tgz
```

Refresh the existing Web page, or restart the same Web profile if the host did not reload the plugin. No build or install script is required. The bundle enables the native Agent Team service, tools and UI and disables the four legacy subagent tool entries, as the official experimental team profile does. Check overlapping IDs if you already use a custom team bundle.

## Use

Open **多智能体 → 角色 → 新增角色** in the sidebar. Set the role name and description, select a model and reasoning effort, write the role prompt, select necessary tools and optional skills, then enable and save it. New roles are disabled and have no tools or skills selected by default.

The lead sees enabled roles and delegates through `spawn_role({role, name, prompt})`. Members use independent native sessions without the lead’s history, so the assigned prompt must include required material and task boundaries. They cannot recursively delegate with the role allowlist.

The native team entry at the top of a conversation opens its members. The plugin’s **子智能体** tab aggregates role-member records for its data directory. Expand a row for output and request evidence, or open the native session. Native `list_agents`, `send_message`, `interrupt_agent`, and `wait_agent` continue to handle collaboration. `inactive` describes scheduling state, not task success.

### Skills

Roles default to `skills: []`. Selected model-invocable skills are resolved using the DSH registry and the member’s working directory, rendered with DSH’s native `<skill_content>` wrapper, and loaded in the system prompt. Their original bodies and resource bases are preserved in the launch snapshot. Even tool-free roles can receive selected skills. No global skill catalog is automatically inherited.

Skill instructions do not expand tool permissions or install dependencies. Missing skills fail new launches explicitly. Editing a role or a skill file does not change existing members’ snapshots.

## Configuration

Data defaults to `$DSH_HOME/agent-roles`, or `~/.dsh/agent-roles` if `DSH_HOME` is unset. `roles.json` stores the catalog; `runs.json` stores launch snapshots, skill bodies, request evidence and the latest output summary (up to 30,000 characters). DSH owns the full session history.

An optional profile override:

```yaml
- id: agent-roles
  config:
    dataDir: ~/my-dsh-data/agent-roles
    fastProviders: []
```

Use separate directories for separate DSH processes: persistence uses atomic writes and in-process revision checks, not cross-process locking. Member records are not automatically expired; the API returns the latest 200. Deleting a role or uninstalling the plugin does not delete session history or local data.

The team defaults to 32 lifetime members and 256 shared tasks. Native DSH subagent concurrency and depth settings still apply; delegation depth 0 prevents launches. The plugin does not raise global limits or permissions.

**Optional Fast integration:** `fastProviders` defaults to an empty list and the control is hidden. This package only stores the selected tier; it does not include a provider-specific priority transport. Configure a provider only when a separate compatible adapter consumes the role launch snapshot. Priority requests may have different billing.

## Security and verification

The plugin installs role configuration through the awaited native `agent/created` hook before the first request. It retains the DSH system prompt and does not implement a separate model loop. Request evidence checks the actual model, reasoning effort, tool names, role body and selected skill bodies. The rc.5 native roster may still display the parent model; use request evidence for the actual route.

The role API uses DSH Web authentication. Tool allowlists constrain model calls but are not directory sandboxes; DSH permissions and filesystem policy remain authoritative. Role and skill bodies are trusted local content. A plugin itself runs with host-process permissions. Protect snapshots and backups as private data and do not share the same authenticated Web session with untrusted users.

## Development

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run release:check
```

The source JavaScript is shipped directly. The client uses host-provided React and UI primitives. Tests use synthetic roles and do not call paid model APIs. See [the release guide](docs/RELEASING.md) for package checks and marketplace submission. Report sanitized errors, not tokens, private roles or full conversations.

## License

[MIT](LICENSE), Copyright © 2026 Delthin.
