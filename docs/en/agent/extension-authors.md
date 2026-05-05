---
description: Guidance for TauriTavern extension authors using background Agent workflows and persist.
---

# Extension Author Guide

This page is for extension authors who want to call Agent abilities from their own frontend code. It focuses on the public Host ABI, not Rust backend internals.

When adapting an extension for Agent, the most important decision is not simply how to start a model request. It is the shape of the work: should this run write to chat, only prepare background material, or save something for later Agent runs in the same chat?

## Foreground and Background

Agent runs have two presentation modes:

| Presentation | Good fit |
| --- | --- |
| `foreground` | Produces a user-visible reply and must successfully call `workspace.commit` at least once before finishing |
| `background` | Organizes summaries, maintains durable state, or prepares material without necessarily writing to chat |

If an extension only wants to update state, organize summaries, or maintain `persist/`, a background run is usually the right shape. It avoids adding extra chat messages and better matches what users expect from background work.

::: tip
Keep the request `presentation` and the Profile's `run.presentation` aligned when possible. Then users can inspect the Profile and understand whether the workflow was designed as foreground or background work.
:::

## Starting a Background Workflow

Extensions should use the public entry point:

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const agent = window.__TAURITAVERN__.api.agent;

const run = await agent.startRunFromLegacyGenerate({
  generationType: 'normal',
  profileId: 'memory-summarizer',
  presentation: 'background',
  options: {
    presentation: 'background',
    stream: false,
  },
});
```

`startRunFromLegacyGenerate()` reuses the current chat's existing prompt assembly, World Info scan, and chat-completion context, then hands the snapshot to the Agent runtime. It is the best current entry point for ordinary extensions.

Current constraints:

- It targets the current active chat.
- It currently requires the chat-completion path.
- `stream` must be `false` or omitted.
- It cannot mix in Legacy ToolManager external tools.
- Invalid parameters fail clearly. The call does not silently fall back to ordinary generation.

The background workflow itself should live in the Agent Profile, not be scattered through extension code. For example, a `memory-summarizer` Profile system prompt might say:

```text
You are the background organizer for the current chat.

Read the existing persist/summary.md file. If it does not exist, create it.
Search recent chat as needed, then keep only short important plot facts, relationship changes, and unresolved threads.
Write the updated content back to persist/summary.md.
Do not commit a chat message. Call workspace.finish when done.
```

The extension starts and observes the run. The Profile describes the task. This makes the workflow easier for users to inspect and adjust.

## Subscribing to Events

After startup, the extension can subscribe to run events:

```js
const terminalEvents = new Set(['run_completed', 'run_failed', 'run_cancelled']);

const stop = agent.subscribe(run.runId, event => {
  console.log(event.type, event.payload);

  if (terminalEvents.has(event.type)) {
    stop();
  }
});
```

Events are ordered by increasing `seq`. Extensions only need to recognize the events they care about, and should not assume the current documentation lists every event type that may ever appear.

Common use:

- Use `run_created`, `profile_resolved`, and `workspace_initialized` to update UI state.
- Use `tool_call_requested` and `tool_call_completed` to show lightweight progress.
- Use `run_completed` to mark completion.
- Use `run_failed` to show a readable error.
- Use `run_cancelled` to mark or collapse a user-cancelled run.

If you need to read a text file from this run, use:

```js
const file = await agent.readWorkspaceFile({
  runId: run.runId,
  path: 'persist/summary.md',
});

console.log(file.text);
```

This reads UTF-8 text files from this run workspace. Model-side file reads should still use the `workspace.read_file` tool.

## Using persist

`persist/` is the durable workspace for the same stable chat. When an Agent run starts, the current chat's existing `persist/` content is projected into the run workspace. Changes made to `persist/` during the run are written back to the stable chat workspace only after `workspace.finish` succeeds.

This gives it a clear boundary:

| Run result | `persist/` behavior |
| --- | --- |
| `workspace.finish` succeeds | Successful changes are promoted back to the stable chat workspace |
| Run failed | No writeback |
| Run cancelled | No writeback |

Good candidates for `persist/`:

- `persist/summary.md`: short plot summary.
- `persist/open-threads.md`: unresolved threads.
- `persist/preferences.md`: writing preferences the user clearly expressed.
- `persist/relationships.md`: relationship state changes.

Poor candidates for `persist/`:

- Complete chat logs.
- Model reasoning.
- Raw tool results.
- One-off drafts.
- Sensitive information the user did not agree to save.

If the Profile does not include `persist` in both `workspace.visibleRoots` and `workspace.writableRoots`, Agent cannot read or modify it. When distributing a background Profile, extension authors should keep workspace permissions and the system prompt aligned.

## Cancel and Rollback

Extensions can call:

```js
await agent.cancel(run.runId);
```

Cancellation asks the run to stop and tries to cancel any in-flight model or tool call. It is not rollback:

- Content already committed to chat is not automatically removed.
- `persist/` changes that already finished successfully are not undone by later UI state.
- A background run that did not finish successfully will not write `persist/` back to the stable workspace.

The current public API still keeps `listRuns()`, `readDiff()`, `rollback()`, and `approveToolCall()` as reserved abilities. They throw explicit errors today. Extensions should not catch those errors and pretend the ability exists; a steadier UI marks the feature as unavailable.

## Maintenance Advice

Agent integration can stay light:

- Use `window.__TAURITAVERN__.api.agent`, not direct Tauri commands or internal modules.
- Describe the task in a dedicated background Profile, not hidden in extension code.
- Do not commit chat messages from background tasks unless the user explicitly asks for visible output.
- Store only short information that later runs truly need in `persist/`.
- When a path is unsupported, say so clearly instead of falling back silently to ordinary generation.

This keeps the boundary between extension, Profile, and UI readable. Users can see what Agent did, and creators have a workflow that is easier to maintain.
