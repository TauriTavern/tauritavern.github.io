---
description: Current TauriTavern Agent capabilities, limits, and planning boundaries.
---

# Current Capabilities and Boundaries

This page describes what the current minimum usable Agent stage can do, what is not open yet, and which compatibility boundaries matter when using it.

It is not a long-term promise list. As TauriTavern evolves, individual capabilities will change. If another Agent page conflicts with this one, treat this page as the current user-facing source of truth.

## Available Today

The current system supports:

- Agent Mode toggle.
- Agent path for normal sends, regenerates, and overswipe generation of new candidates.
- Agent run timeline.
- Agent Profile listing, loading, saving, deletion, and export.
- Built-in `default-writer` profile.
- SKILLS import, preview, installation, reading, export, and deletion.
- Agent reads from the current chat history.
- Agent reads world info entries activated for the current run.
- Agent reads SKILLS allowed by the active profile.
- Agent reads, searches, writes, and edits files in the workspace.
- Agent commits `output/main.md` as the chat message.

## Current Built-In Tools

| Area | Tool | Status |
| --- | --- | --- |
| Context | `chat.search` | Available |
| Context | `chat.read_messages` | Available |
| Context | `worldinfo.read_activated` | Available |
| SKILLS | `skill.list` | Available |
| SKILLS | `skill.search` | Available |
| SKILLS | `skill.read` | Available |
| Workspace | `workspace.list_files` | Available |
| Workspace | `workspace.search_files` | Available |
| Workspace | `workspace.read_file` | Available |
| Workspace | `workspace.write_file` | Available |
| Workspace | `workspace.apply_patch` | Available |
| Control | `workspace.commit` | Available |
| Control | `workspace.finish` | Available |

## Current Generation Boundary

Agent currently captures the context for a run through a compatibility bridge. In practice, it first uses the existing SillyTavern generation flow to assemble prompt and world info, then passes that material into the Rust Agent runtime for the tool loop.

Important notes:

- The current path requires chat completion.
- Agent streaming output is not supported yet.
- Prompt snapshots that already contain external tools, `tool_choice`, or tool turns are rejected.
- Agent tools are registered by the TauriTavern runtime and should not be mixed with Legacy ToolManager result messages.
- When Agent Mode is off, ordinary SillyTavern generation semantics remain unchanged.

## Current Profile Boundary

Profiles can currently control:

- Visible tools.
- SKILLS visibility and read budgets.
- Visible and writable workspace roots.
- Message body output path.
- Maximum tool-loop rounds and calls.
- Foreground or background presentation.
- Retry behavior for transient model errors.
- Agent system prompt.

Not open yet:

- Automatic model switching by profile stage.
- Preset-driven provider or model takeover.
- Full Plan Mode runtime.
- Automatic routing across multiple profiles.
- Plan-node-specific tool and output restrictions.

If a profile asks for a mode that is not supported yet, TauriTavern prefers to fail explicitly instead of quietly continuing with defaults.

## Current SKILLS Boundary

SKILLS currently provide local knowledge management and on-demand Agent reading.

Supported today:

- Import from local archives.
- Preview imported content.
- Choose skip or replace on same-name conflicts.
- View the installed Skill file tree.
- Read UTF-8 text files.
- Export `.ttskill` packages.

Not supported today:

- Executing scripts from a Skill.
- Letting a Skill grant tool permissions.
- Letting a Skill automatically install an MCP server.
- Letting Agent install or replace Skills during a run.
- Marketplace, automatic updates, or multi-version dependency resolution.

## Agent Capabilities Not Open Yet

These capabilities have a place in the design, but user-facing content should not depend on them yet:

| Capability | Current status |
| --- | --- |
| `readDiff` | API name reserved, not implemented today |
| `rollback` | API name reserved, not implemented today |
| `listRuns` | API name reserved, not implemented today |
| `approveToolCall` | API name reserved, not implemented today |
| resume-run | Not open as a user feature |
| MCP tools | Not connected to the Agent tool set yet |
| shell tools | Not a default capability today |
| extension tool bridge | Not open as a stable user feature yet |
| Agent streaming timeline chunks | Provider stream chunks are not Agent events today |

## Compatibility Principles

Current TauriTavern Agent follows these principles:

- When Agent Mode is off, Legacy Generate is not changed.
- Agent tool results are not written as chat messages.
- Agent timeline events do not pretend to be SillyTavern `GENERATION_*` or `TOOL_CALLS_*` events.
- Chat commits still use the existing save path.
- Workspace paths must be relative and cannot escape the workspace.
- User-denied tools and platform-denied capabilities cannot be overridden by an Agent Profile.

These limits may look conservative, but they protect upstream compatibility, mobile performance, and long-term maintainability.

## Where to Look When a Run Fails

If an Agent run fails, check in this order:

1. Whether the current connection uses a supported chat-completion path.
2. Whether the profile keeps `workspace.commit` and `workspace.finish`.
3. Whether the system prompt asks for a disabled tool.
4. Whether a Skill name is misspelled or denied by the profile.
5. Whether the output path is still visible and writable.
6. Which event failed last in the timeline.

If Agent fails directly without producing an ordinary generation result, that is part of the current design. Explicit failure is easier for users and creators to diagnose than silent fallback.

