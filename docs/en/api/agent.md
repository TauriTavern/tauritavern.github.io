---
description: Entry points, inputs and outputs, event subscription, Agent Profiles, and error semantics for the TauriTavern Agent Host ABI.
---

# Agent API

The Agent API is the host interface TauriTavern exposes to the frontend, extensions, and debugging scripts. It describes the behavior available through `window.__TAURITAVERN__.api.agent`. It is not the same thing as the internal Rust services.

Today, the Agent API is mainly used to start Agent runs, subscribe to run events, read workspace files, cancel runs, and manage Agent Profiles.

[[toc]]

## Entry Point

Wait for the Host ABI before using it:

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const agent = window.__TAURITAVERN__.api.agent;
```

Do not call Tauri command names directly, and do not depend on internal module paths. The public entry point is `window.__TAURITAVERN__.api.agent`.

## Methods

```ts
type TauriTavernAgentApi = {
  startRunFromLegacyGenerate(input?: AgentStartRunFromLegacyGenerateInput): Promise<AgentRunHandle>;
  startRunWithPromptSnapshot(input: AgentStartRunWithPromptSnapshotInput): Promise<AgentRunHandle>;
  subscribe(runId: string, handler: (event: AgentRunEvent) => void, options?: AgentSubscribeOptions): TauriTavernHostUnsubscribe;
  cancel(runId: string): Promise<AgentRunHandle>;
  readEvents(input: AgentReadEventsInput): Promise<AgentReadEventsResult>;
  readWorkspaceFile(input: AgentReadWorkspaceFileInput): Promise<AgentWorkspaceFile>;
  profiles: AgentProfilesApi;

  approveToolCall(): never;
  listRuns(): never;
  readDiff(): never;
  rollback(): never;
};
```

There is no public `startRun()` shorthand. The startup method must make the prompt source clear:

| Method | Purpose |
| --- | --- |
| `startRunFromLegacyGenerate()` | Recommended current entry point. Captures this turn's context through Legacy Generate dryRun |
| `startRunWithPromptSnapshot()` | For callers that already hold a prompt snapshot |

`approveToolCall()`, `listRuns()`, `readDiff()`, and `rollback()` are reserved names. They currently throw explicit errors.

## startRunFromLegacyGenerate

```ts
type AgentStartRunFromLegacyGenerateInput = {
  chatRef?: AgentChatRef;
  stableChatId?: string;
  generationType?: string;
  generateOptions?: Record<string, unknown>;
  profileId?: string | null;
  generationIntent?: unknown;
  presentation?: 'foreground' | 'background';
  options?: {
    presentation?: 'foreground' | 'background';
    stream?: false;
  };
};
```

This is the best current startup entry for ordinary extensions and debugging scripts. It will:

1. Run the current SillyTavern generation flow in dryRun mode.
2. Capture generation data from this turn's `GENERATE_AFTER_DATA`.
3. Capture the final World Info activation snapshot from this turn's `WORLDINFO_SCAN_DONE`.
4. Build a `promptSnapshot`.
5. Call `startRunWithPromptSnapshot()` to start the Agent run.

Example:

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const run = await window.__TAURITAVERN__.api.agent.startRunFromLegacyGenerate({
  generationType: 'normal',
  profileId: 'default-writer',
  options: {
    stream: false,
    presentation: 'foreground',
  },
});
```

Current constraints:

- It is for the current active chat.
- It currently requires the chat-completion path.
- `stream` must be `false` or omitted.
- It cannot mix in Legacy ToolManager external tools.
- If dryRun does not produce chat-completion messages, the call fails.
- If the prompt snapshot already contains external `tools`, `tool_choice`, or tool turns, the call fails.

::: warning dryRun is not a pure read
This dryRun still triggers existing prompt assembly, events, and World Info scanning. It simply does not perform the final model request or chat save. Callers should not treat it as a side-effect-free data read.
:::

## startRunWithPromptSnapshot

```ts
type AgentStartRunWithPromptSnapshotInput = {
  chatRef: AgentChatRef;
  stableChatId?: string;
  generationType?: string;
  profileId?: string | null;
  promptSnapshot: AgentPromptSnapshot;
  generationIntent?: unknown;
  presentation?: 'foreground' | 'background';
  options?: {
    presentation?: 'foreground' | 'background';
    stream?: boolean;
  };
};

type AgentPromptSnapshot = {
  chatCompletionPayload: unknown;
  worldInfoActivation?: {
    timestampMs: number;
    trigger: string;
    entries: Array<{
      world: string;
      uid: string | number;
      displayName: string;
      constant: boolean;
      content: string;
      position?: string;
    }>;
  };
};
```

This method is for advanced callers that already hold a prompt snapshot. For ordinary use, constructing a snapshot by hand is not recommended, because it must match the current provider payload and Agent tool boundaries.

Identity semantics:

| Field | Meaning |
| --- | --- |
| `chatRef` | Reference to the current chat |
| `stableChatId` | Stable chat identity. If omitted, the frontend resolves it through `api.chat.open(chatRef).stableId()` |
| `runId` | New run identity for each generation |
| `workspaceId` | Agent workspace identity derived from the stable chat identity |

Return value:

```ts
type AgentRunHandle = {
  runId: string;
  status: AgentRunStatus;
  workspaceId: string;
  stableChatId: string;
};
```

Current requirements:

- `promptSnapshot.chatCompletionPayload` must be a usable chat-completion payload.
- `worldInfoActivation` is optional. If omitted, `worldinfo.read_activated` cannot read this turn's activated entries.
- `options.stream: true` is rejected.
- `workspaceMode` and resume semantics are not public abilities today.
- Invalid parameters reject clearly. The call does not automatically fall back to ordinary generation.

## subscribe

```ts
type AgentSubscribeOptions = {
  afterSeq?: number;
  limit?: number;
  intervalMs?: number;
  onError?: (error: unknown) => void;
};

const stop = agent.subscribe(run.runId, event => {
  console.log(event.type, event.payload);
});

stop();
```

Today, `subscribe()` is a polling wrapper over `readEvents()`. The returned unsubscribe function is idempotent.

Defaults:

| Option | Default |
| --- | --- |
| `afterSeq` | `0` |
| `limit` | `100` |
| `intervalMs` | `500` ms. Values below 100 fall back to the default |

Events are ordered by monotonically increasing `seq`. A caller can store the last observed `seq` and continue from that position later.

## readEvents

```ts
type AgentReadEventsInput = {
  runId: string;
  afterSeq?: number;
  beforeSeq?: number;
  limit?: number;
};

type AgentReadEventsResult = {
  events: AgentRunEvent[];
};
```

Event envelope:

```ts
type AgentRunEvent = {
  seq: number;
  id: string;
  runId: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  type: string;
  payload: unknown;
};
```

Common event types include:

```text
run_created
profile_resolved
workspace_initialized
context_assembled
model_request_created
model_completed
tool_call_requested
tool_call_completed
tool_call_failed
workspace_file_written
workspace_patch_applied
checkpoint_created
chat_commit_requested
chat_commit_completed
persistent_changes_committed
run_completed
run_cancelled
run_failed
```

More event types may appear as Agent grows. Callers should recognize the events they care about instead of assuming the list above is exhaustive.

## cancel

```js
const handle = await agent.cancel(runId);
```

Cancel requests the current run to stop and tries to cancel any in-flight model or tool work.

Cancel is not failure:

- It does not automatically commit chat content.
- Already committed messages are not automatically rolled back.
- The return value is the latest run handle.

## readWorkspaceFile

```ts
type AgentReadWorkspaceFileInput = {
  runId: string;
  path: string;
};

type AgentWorkspaceFile = {
  path: string;
  text: string;
  bytes: number;
  sha256: string;
};
```

This method lets frontend code, extensions, and debugging UI read UTF-8 text files from the run workspace. Model-side file reads should use the `workspace.read_file` tool, not the Host ABI.

Path requirements:

- Must be workspace-relative.
- Must not be absolute.
- Must not contain `..`.
- Must not use a Windows drive prefix.
- `checkpointId` is not supported today.

## profiles

Agent Profile management is available at:

```js
const profiles = window.__TAURITAVERN__.api.agent.profiles;
```

Methods:

```ts
type AgentProfilesApi = {
  list(): Promise<{ profiles: AgentProfileSummary[] }>;
  load(input: string | { profileId: string }): Promise<{ profile: AgentProfileDefinition | null }>;
  save(input: AgentProfileDefinition | { profile: AgentProfileDefinition }): Promise<void>;
  delete(input: string | { profileId: string }): Promise<void>;
};
```

Profile IDs must use lowercase ASCII letters, digits, `-`, or `_`, and must be no longer than 128 characters.

Minimal structure example:

```json
{
  "schemaVersion": 1,
  "kind": "tauritavern.agentProfile",
  "id": "my-writer",
  "displayName": "My Writer",
  "preset": {
    "mode": "currentPromptSnapshot"
  },
  "model": {
    "mode": "currentPromptSnapshot"
  },
  "run": {
    "presentation": "foreground",
    "modelRetry": {
      "maxRetries": 3,
      "intervalMs": 3000
    }
  },
  "instructions": {
    "agentSystemPrompt": null
  },
  "tools": {
    "allow": [
      "chat.search",
      "chat.read_messages",
      "worldinfo.read_activated",
      "skill.list",
      "skill.search",
      "skill.read",
      "workspace.list_files",
      "workspace.search_files",
      "workspace.read_file",
      "workspace.write_file",
      "workspace.apply_patch",
      "workspace.commit",
      "workspace.finish"
    ],
    "deny": [],
    "maxRounds": 80,
    "maxCallsPerRun": 80
  },
  "skills": {
    "visible": ["*"],
    "deny": [],
    "maxReadCharsPerCall": 20000,
    "maxReadCharsPerRun": 80000
  },
  "workspace": {
    "visibleRoots": ["output", "scratch", "plan", "summaries", "persist"],
    "writableRoots": ["output", "scratch", "plan", "summaries", "persist"]
  },
  "plan": {
    "mode": "none"
  },
  "output": {
    "artifacts": [
      {
        "id": "main",
        "path": "output/main.md",
        "kind": "markdown",
        "target": "messageBody",
        "required": true,
        "assemblyOrder": 0
      }
    ]
  }
}
```

Current Profile boundaries:

- `model.mode` only supports `currentPromptSnapshot`.
- `preset.mode` can record current prompt snapshot or reference information, but it does not rewrite the prompt snapshot today.
- `plan.mode` currently only supports `none`.
- Foreground runs need `workspace.commit` and `workspace.finish`; otherwise they cannot submit and end normally.
- `output.artifacts` currently must contain one message body artifact with target `messageBody`.

## Internal Commit Handshake

Chat commit is not a public Host API method. It is completed through the Agent tool and host bridge:

```text
model calls workspace.commit
  -> Rust runtime writes chat_commit_requested event
  -> frontend bridge reads workspace file
  -> bridge calls saveReply()
  -> bridge writes message.extra.tauritavern.agent
  -> bridge calls resolve_agent_chat_commit
```

Commit metadata is written to `extra.tauritavern.agent` on the message:

```ts
type AgentMessageExtra = {
  version: 1;
  runId: string;
  workspaceId: string;
  stableChatId: string;
  profileId: string | null;
  checkpointId: string;
  commitId: string;
  commitSeq: number;
  commits: Array<{
    seq: number;
    commitId: string;
    checkpointId: string;
    path: string;
    mode: 'replace' | 'append';
    reason?: string;
    bytes: number;
    sha256: string;
  }>;
  artifacts: Array<{
    path: string;
    target: 'message_body';
    bytes: number;
    sha256: string;
  }>;
};
```

Extensions may read this metadata to identify which Agent run produced a message, but they should not forge commits themselves.

## Error Semantics

The Agent API prefers clear failure over silently falling back to ordinary generation. Common error codes or prefixes include:

| Error | Meaning |
| --- | --- |
| `agent.phase2b_chat_completion_required` | The current path is not a supported chat-completion path |
| `agent.external_tools_unsupported_phase2b` | The prompt snapshot already contains external tools |
| `agent.external_tool_turns_unsupported_phase2b` | The prompt snapshot already contains tool turns |
| `agent.presentation_invalid` | `presentation` is not `foreground` or `background` |
| `agent.invalid_profile` | Profile structure or policy is invalid |
| `tool.policy_denied` | A hidden or denied tool was requested |
| `workspace.path_denied` | Workspace path is invalid or hidden |
| `workspace.required_artifact_missing` | A required output artifact is missing |
| `model.request_failed` | Model request failed |
| `commit.save_failed` | Chat save failed |

Model-correctable tool errors usually return to the model as tool results. Host-level errors move the run into failed state.

## Reserved but Not Implemented

These methods currently throw explicit errors:

| Method | Current state |
| --- | --- |
| `approveToolCall()` | Approval flow is not open yet |
| `listRuns()` | Run listing is not open yet |
| `readDiff()` | Diff reading is not open yet |
| `rollback()` | Rollback is not open yet |

Callers should not catch these errors and pretend the ability exists. A steadier approach is to mark the corresponding UI as unavailable.

## Related Pages

- Tool inputs and outputs: [Agent Tool Reference](/en/api/agent-tools).
- Skill management entry point: [Skill API](/en/api/skill).
- Runtime model: [Agent System Architecture](/en/architecture/agent).
