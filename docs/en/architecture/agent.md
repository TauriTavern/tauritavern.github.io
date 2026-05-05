---
description: Understand the public architecture of TauriTavern Agent, including the workspace runtime, tool loop, timeline, and compatibility boundaries.
---

# Agent System Architecture

The TauriTavern Agent system is not ordinary generation with a larger prompt, and it does not keep putting tool results back into chat history. It is a separate creation path: a generation first enters a constrained workspace, the Agent reads, searches, writes, and edits files there, and the selected output is submitted to the chat when the run is ready.

This page is for users, creators, and integrators who want to understand the overall mechanism. It does not require knowledge of TauriTavern's internal Rust modules, but it does describe the public boundaries that can be relied on today.

[[toc]]

## Core Idea

Traditional SillyTavern generation is roughly:

```text
prepare context -> call model -> receive text -> save to chat
```

Agent Mode turns this into a process closer to writing and editing:

```text
prepare context
  -> create the workspace for this run
  -> expose tools, SKILLS, and workspace files according to the Agent Profile
  -> let the Agent search, read, draft, and revise
  -> commit the output file to chat
  -> keep the process in the timeline
```

The important change is the boundary. The model does not edit chat directly, and it cannot freely access system files. It can only act through TauriTavern tools inside the workspace. Each meaningful step becomes an event in the run.

## Three Generation Paths

The generation-related abilities in TauriTavern can be understood as three paths:

| Path | Purpose | Boundary |
| --- | --- | --- |
| Ordinary generation | Preserves the original SillyTavern experience | Used when Agent Mode is off |
| Agent generation | Multi-round tools, workspace, timeline, and commit | Tool results do not become chat message layers |
| Explicit tool abilities | Future surface for MCP or tool panels | Does not automatically own an Agent runtime |

When Agent Mode is off, ordinary generation, upstream events, and legacy extension semantics should remain unchanged. When Agent Mode is on, normal send, regenerate, and right-swipe new candidate generation enter the Agent path. Switching to an existing swipe candidate keeps the original behavior.

## Current Run Flow

In the current minimum usable stage, Agent still borrows the existing SillyTavern frontend flow to prepare this turn's context, then hands execution to the Rust Agent runtime.

```text
user sends a message
  -> frontend runs Legacy Generate dryRun
  -> capture this turn's chat-completion payload and final World Info activation snapshot
  -> start Agent run
  -> resolve Agent Profile
  -> create run workspace and timeline journal
  -> call model
  -> call tools, write workspace files, create checkpoints
  -> workspace.commit requests a chat commit
  -> frontend host bridge saves the message through saveReply
  -> workspace.finish ends the run
```

The `dryRun` step is a compatibility bridge, not the final architecture. It triggers the existing prompt assembly and World Info scan, but it does not make the final model request. Over time, more context assembly will move into structured Agent context.

::: warning Current compatibility bridge
Agent currently requires the chat-completion path. It rejects prompt snapshots that already contain external `tools`, `tool_choice`, `role: "tool"`, or assistant `tool_calls`, because the Agent tool registry is owned by the TauriTavern runtime.
:::

## Identity and Workspace

Several identities appear during an Agent run:

| Name | Meaning |
| --- | --- |
| `chatRef` | A locatable reference to the current chat, such as a character chat or group chat |
| `stableChatId` | The long-lived chat identity, stable across renames and imports |
| `workspaceId` | The Agent workspace identity for the same stable chat |
| `runId` | The identity of one Agent run; each send, regenerate, or new candidate gets a new one |

The same chat can have many Agent runs. They share the chat-level persistent workspace, but each run has its own run workspace, event journal, and output files.

## Workspace Roots

The model sees logical workspace paths, not system file paths. Common roots are:

| Root | Purpose |
| --- | --- |
| `output/` | Final outputs. The default message body is `output/main.md` |
| `scratch/` | Temporary drafts, notes, and analysis |
| `plan/` | Planning files. Full Plan Mode is not open yet, but the root is reserved |
| `summaries/` | Summaries and stage notes |
| `persist/` | Durable information that later runs in the same chat may reuse |

Workspace paths must be relative paths. They cannot contain `..`, absolute paths, Windows drive prefixes, or NUL characters. The Agent cannot escape the workspace through path syntax.

Some runtime files are not exposed for direct model reads, for example:

```text
input/
tool-args/
tool-results/
model-responses/
checkpoints/
events.jsonl
```

These files record and recover the run. They are not ordinary working material for the model.

## Context Sources

Today, Agent can work with context from these places:

| Source | Current path into Agent |
| --- | --- |
| Current generation prompt | `promptSnapshot.chatCompletionPayload` captured by Legacy dryRun |
| Chat history | Read on demand through `chat.search` and `chat.read_messages` |
| World Info | Final activation snapshot captured for this dryRun |
| SKILLS | Read on demand through `skill.list`, `skill.search`, and `skill.read`, if allowed by the Profile |
| Workspace files | Read, search, write, and edit through workspace tools |
| Tool results | Fed back into later model turns as Agent context, not written into chat history |

This preserves SillyTavern's flexible prompt tradition while avoiding the need to load all history, all Skill text, or all tool results into the model context at once.

## Agent Profile

An Agent Profile is the strategy for one run. It is not only a model selector.

Current Profiles can control:

| Area | Current ability |
| --- | --- |
| Run behavior | Foreground or background, transient model retry, maximum rounds |
| System prompt | Replace the default Agent runtime instruction |
| Tools | Allow, deny, description overrides, and call budgets |
| SKILLS | Visible Skills, denied Skills, and read budgets |
| Workspace | Visible roots and writable roots |
| Output | Currently must contain one message body artifact |
| Plan | Only `none` is open today; other modes fail clearly |

The model and API currently follow this turn's prompt snapshot. A Profile does not yet switch provider or model automatically. `preset.ref` is mainly recorded and validated today; it does not rewrite the prompt snapshot.

## Tool System

Each Agent tool has two names:

| Name | Purpose |
| --- | --- |
| Canonical name | Used by TauriTavern internals and Profiles, such as `workspace.apply_patch` |
| Model-facing alias | A provider-safe name exposed to the model, such as `workspace_apply_patch` |

Tool calls are not chat messages. A tool call enters the run timeline, and its result can become part of later model context.

Tool errors are split into two kinds:

| Kind | Behavior |
| --- | --- |
| Model-correctable error | Returned as an `is_error = true` tool result, such as hidden path, missing argument, or non-unique patch match |
| Host-level error | Fails the run, such as journal failure, checkpoint failure, save conflict, or invalid model response structure |

This lets the Agent correct ordinary operation mistakes without silently continuing after critical state has been damaged.

## Timeline and Events

Every Agent run has ordered append-only events. The user-facing timeline is a projection of these events.

Common events include:

| Category | Examples |
| --- | --- |
| Lifecycle | `run_created`, `run_completed`, `run_failed`, `run_cancelled` |
| Status | `status_changed` |
| Context | `context_assembled` |
| Model | `model_request_created`, `model_completed`, `model_response_stored` |
| Tool | `tool_call_requested`, `tool_call_completed`, `tool_call_failed` |
| Workspace | `workspace_file_written`, `workspace_patch_applied` |
| Checkpoint | `checkpoint_created` |
| Commit | `chat_commit_requested`, `chat_commit_completed` |
| Persistence | `persistent_changes_committed` |

Provider streaming chunks are not Agent run events today. The Agent timeline focuses on the steps of the run, not on mirroring provider text deltas token by token.

## Committing to Chat

The Agent commits a workspace file to chat. It does not turn raw model text directly into a message.

The default commit path is:

```text
output/main.md
```

The `workspace.commit` tool triggers the commit. Two modes are available today:

| Mode | Meaning |
| --- | --- |
| `replace` | Replace this run's Agent message with the selected file |
| `append` | Append the selected file to the same Agent message; the first append creates the message |

The commit still goes through the frontend host bridge and upstream `saveReply()`, respecting the existing chat save queue and windowed payload semantics. The Rust backend does not bypass the chat save contract by editing JSONL directly.

After a commit, `extra.tauritavern.agent` on the message records the run identity, checkpoint, commit, and artifact summary. The chat shows only the final text; process details remain in the timeline and workspace.

## Compatibility Principles

The current Agent system keeps these boundaries:

- When Agent Mode is off, Legacy Generate behavior remains unchanged.
- Agent tool results are not written as chat message layers.
- Agent events do not pretend to be SillyTavern `GENERATION_*` or `TOOL_CALLS_*` events.
- Model calls continue to use TauriTavern's existing API settings, secrets, logs, and platform policies.
- Chat commits continue through the existing save path.
- Invalid configuration, path escape, and denied tools fail clearly or return model-correctable tool errors. They do not silently fall back.

## Not Open Yet

These abilities have a place in the design, but should not be treated as publicly reliable today:

| Ability | Current state |
| --- | --- |
| Full Plan Mode runtime | Schema is reserved; only `none` is supported today |
| Automatic Profile model switching | Not open yet |
| MCP tools | Not connected to the Agent toolset yet |
| shell tools | Not a default ability |
| extension tool bridge | Not open as a stable ability |
| `readDiff` | API name is reserved; currently fails explicitly |
| `rollback` | API name is reserved; currently fails explicitly |
| `approveToolCall` | API name is reserved; currently fails explicitly |
| resume-run / listRuns | Not open as user-facing abilities |

## Continue Reading

- To start using Agent Mode, read [Agent Quick Start](/en/agent/quick-start).
- To see tool inputs and outputs, read [Agent Tool Reference](/en/api/agent-tools).
- To integrate with the Host ABI, read [Agent API](/en/api/agent).
- To manage Skill packages, read [Skill API](/en/api/skill).
