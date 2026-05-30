---
description: Current TauriTavern Agent capabilities, limits, and planning boundaries.
---

# Current Capabilities and Boundaries

This page describes what Agent can do today, what is not open yet, and which compatibility boundaries matter when using it.

It is not a long-term promise list. As TauriTavern changes, individual capabilities may change. If another Agent page conflicts with this one, treat this page as the current user-facing source of truth.

## Available Today

The current system supports:

- Agent Mode toggle.
- Agent path for normal sends, regenerates, and overswipe generation of new candidates.
- `/trigger` in supported cases.
- Agent run timeline.
- Agent Profile listing, loading, saving, deletion, and export.
- Built-in `default-writer` profile.
- Agent Profile v2, including independent Preset and independent Model binding.
- SKILLS import, preview, installation, reading, export, and deletion.
- Skill scopes: global, preset, Profile, and character.
- Agent reads from the current chat history.
- Agent reads world info entries activated for the current run.
- Agent reads SKILLS allowed by the active Profile.
- Agent reads, searches, writes, and edits files in the workspace.
- Agent commits `output/main.md` or another configured path as the chat message.
- Agent can use append commits to build a shorter conversational reply within one run.
- A main Agent can delegate focused work to SubAgents and wait for results.

## Current Built-In Tools

| Area | Tool | Status |
| --- | --- | --- |
| Agent collaboration | `agent.list` | Available |
| Agent collaboration | `agent.delegate` | Available |
| Agent collaboration | `agent.await` | Available |
| Agent collaboration | `task.return` | Available during child task runs |
| Chat | `chat.search` | Available |
| Chat | `chat.read_messages` | Available |
| World info | `worldinfo.read_activated` | Available |
| SKILLS | `skill.list` | Available |
| SKILLS | `skill.search` | Available |
| SKILLS | `skill.read` | Available |
| Workspace | `workspace.list_files` | Available |
| Workspace | `workspace.search_files` | Available |
| Workspace | `workspace.read_file` | Available |
| Workspace | `workspace.write_file` | Available, supports replace and append |
| Workspace | `workspace.apply_patch` | Available |
| Control | `workspace.commit` | Available, supports replace and append |
| Control | `workspace.finish` | Available |
| Randomness | `dice.roll` | Available, but must be explicitly allowed by the Profile |

`workspace.commit` supports replace and append. Append is useful for shorter conversational replies, staged responses, and lighter chat pacing.

## Current Generation Boundary

Agent currently captures the context for a run through a compatibility bridge. In practice, it uses SillyTavern context assembly, world info scanning, and macro handling, then passes that material into the Rust Agent runtime for the tool loop.

Important notes:

- The current path requires chat completion.
- Group-chat Agent runs are not supported yet.
- Agent streaming output is not supported yet.
- Prompt snapshots that already contain external tools, `tool_choice`, or tool turns are rejected.
- Agent tools are registered by the TauriTavern runtime and should not be mixed with Legacy ToolManager result messages.
- When Agent Mode is off, ordinary SillyTavern generation semantics remain unchanged.

## Current Profile Boundary

Profiles can currently control:

- Preset binding: current snapshot, preset reference, or no preset binding.
- Model binding: current snapshot, a [saved model configuration](/en/agent/faq#agent-profile-model-from-api-connection), or a `requires configuration` state.
- Visible tools and tool budgets.
- SKILLS visibility and read budgets.
- Initial chat history count and whether activated world info is included.
- Visible and writable workspace roots.
- Message body output path.
- Maximum tool-loop rounds and calls.
- Foreground or background presentation.
- Whether the Profile is directly runnable.
- Whether it can create SubAgents, whether it can run as a SubAgent, concurrency limits, and result budget.
- Retry behavior for transient model errors.
- Agent system prompt.

Not open yet:

- Automatic switching across several Profiles by stage.
- Full Plan Mode runtime.
- User-facing `agent.handoff`.
- Model-visible child task cancellation.
- Plan-node-specific tool and output restrictions.
- Automatic routing across multiple main Profiles.

If a Profile asks for a mode that is not supported yet, TauriTavern prefers to fail explicitly instead of quietly continuing with defaults.

## Current SubAgent Boundary

Return-mode SubAgents are available today:

- A main Agent can list callable Agents.
- A main Agent can start child tasks.
- A main Agent can wait for one or more child task results.
- A SubAgent can use `task.return` to return a summary, findings, warnings, suggestions, and artifact references.
- Child tasks run in the background and do not submit chat messages directly.
- When a run ends or is cancelled, unfinished child tasks are cancelled.

Still not implemented:

- Agent handoff.
- Model-driven cancellation of other child tasks.

## Current SKILLS Boundary

SKILLS currently provide local knowledge management and on-demand Agent reading.

Supported today:

- Import from local archives.
- Preview imported content.
- Choose skip or replace on same-name conflicts.
- View the installed Skill file tree.
- Read UTF-8 text files.
- Export Skills.
- Manage Skills by global, preset, Profile, and character scope.

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

Append commits do not create several independent chat message rows. They add to the same Agent message within one Agent run.

## Compatibility Principles

Current TauriTavern Agent follows these principles:

- When Agent Mode is off, Legacy Generate is not changed.
- Agent tool results are not written as chat messages.
- Agent timeline events do not pretend to be SillyTavern `GENERATION_*` or `TOOL_CALLS_*` events.
- Chat commits still use the existing save path.
- Workspace paths must be relative and cannot escape the workspace.
- User-denied tools and platform-denied capabilities cannot be overridden by an Agent Profile.
- Exported Profiles do not carry local secrets or local model connections.

These limits may look conservative, but they protect upstream compatibility, mobile performance, and long-term maintainability.

## Where to Look When a Run Fails

If an Agent run fails, check in this order:

1. Whether the current connection uses a supported chat-completion path.
2. Whether `Active Profile` is directly runnable.
3. Whether the Profile model is [configured on this machine](/en/agent/faq#agent-profile-model-from-api-connection).
4. Whether a foreground Profile keeps `workspace.commit` and `workspace.finish`.
5. Whether the system prompt asks for a disabled tool.
6. Whether the SubAgent target allows the current Profile to call it.
7. Whether a Skill name is misspelled or denied by the Profile.
8. Whether the output path is still visible and writable.
9. Which event failed last in the timeline.

If Agent fails directly without producing an ordinary generation result, that is part of the current design. Explicit failure is easier for users and creators to diagnose than silent fallback.
