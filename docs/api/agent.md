---
description: TauriTavern Agent Host ABI 的入口、输入输出、事件订阅、配置档案和错误语义。
---

# Agent API

Agent API 是 TauriTavern 暴露给前端、扩展和调试脚本的宿主接口。它描述的是 `window.__TAURITAVERN__.api.agent` 这一层可以依赖的行为，不等同于 Rust 后端内部服务。

当前 Agent API 的主要用途是启动 Agent run、订阅运行事件、读取工作区文件、取消运行，以及管理 Agent Profile。

[[toc]]

## 入口

在使用前，先等待宿主 ABI 就绪：

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const agent = window.__TAURITAVERN__.api.agent;
```

不要直接调用 Tauri command 名称，也不要依赖内部模块路径。公开入口以 `window.__TAURITAVERN__.api.agent` 为准。

## 方法概览

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

当前没有公共 `startRun()` 简写。启动方法需要明确说明 prompt 来源：

| 方法 | 用途 |
| --- | --- |
| `startRunFromLegacyGenerate()` | 当前推荐入口，从 Legacy Generate dryRun 捕获本轮上下文 |
| `startRunWithPromptSnapshot()` | 调用方已经持有 prompt snapshot 时使用 |

`approveToolCall()`、`listRuns()`、`readDiff()`、`rollback()` 目前只是预留名称，调用会显式抛错。

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

这是当前最适合普通扩展和调试脚本使用的启动入口。它会：

1. 调用当前 SillyTavern 生成流程的 dryRun。
2. 捕获本轮 `GENERATE_AFTER_DATA` 中的生成数据。
3. 捕获本轮最终 `WORLDINFO_SCAN_DONE` 中的世界书激活快照。
4. 构造 `promptSnapshot`。
5. 调用 `startRunWithPromptSnapshot()` 启动 Agent run。

示例：

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

当前约束：

- 只支持当前 active chat。
- 当前要求使用 chat-completion 路径。
- `stream` 必须为 `false` 或省略。
- 不能混用 Legacy ToolManager 的 external tools。
- 如果 dryRun 没有产出 chat-completion messages，会直接失败。
- 如果 prompt snapshot 已包含外部 `tools`、`tool_choice` 或 tool turns，会直接失败。

::: warning dryRun 不是纯函数
这里的 dryRun 会触发原有 prompt 组织、事件和世界书扫描，只是不会执行最终模型请求和聊天保存。调用方不应该把它理解成完全无副作用的纯数据读取。
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

这个方法适合已经持有 prompt snapshot 的高级调用方。普通使用不建议手工构造 snapshot，因为它需要符合当前 provider payload 和 Agent 工具边界。

身份语义：

| 字段 | 含义 |
| --- | --- |
| `chatRef` | 当前聊天引用 |
| `stableChatId` | 稳定聊天身份；省略时前端会通过 `api.chat.open(chatRef).stableId()` 解析 |
| `runId` | 每次启动生成的新运行身份 |
| `workspaceId` | 由稳定聊天身份派生的 Agent 工作区身份 |

返回值：

```ts
type AgentRunHandle = {
  runId: string;
  status: AgentRunStatus;
  workspaceId: string;
  stableChatId: string;
};
```

当前要求：

- `promptSnapshot.chatCompletionPayload` 必须是可用的 chat-completion payload。
- `worldInfoActivation` 可选；如果省略，`worldinfo.read_activated` 无法读到本轮激活条目。
- `options.stream: true` 会被拒绝。
- `workspaceMode` / resume 语义当前不作为公开能力。
- 参数错误会 reject，不会自动退回普通生成。

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

当前 `subscribe()` 是轮询封装，底层调用 `readEvents()`。返回的 unsubscribe 函数可以重复调用。

默认行为：

| 参数 | 默认 |
| --- | --- |
| `afterSeq` | `0` |
| `limit` | `100` |
| `intervalMs` | `500` 毫秒，低于 100 会回到默认值 |

事件按 `seq` 单调递增。调用方可以保存最后看到的 `seq`，下次从该位置继续读取。

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

事件 envelope：

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

常见事件类型包括：

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

事件类型会随 Agent 能力扩展而增加。调用方应优先识别自己关心的事件，不要假设只会出现上面这些类型。

## cancel

```js
const handle = await agent.cancel(runId);
```

取消会请求当前 run 停止，并尽力取消正在进行的模型调用或工具调用。

取消不是失败：

- 取消后不会自动提交聊天。
- 已经提交过的消息不会因为取消自动回滚。
- 返回值是最新的 run handle。

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

这个方法供前端、扩展和调试界面读取本次 run workspace 中的 UTF-8 文本文件。模型侧读取文件应使用 `workspace.read_file` 工具，而不是 Host ABI。

路径要求：

- 必须是 workspace 相对路径。
- 不能是绝对路径。
- 不能包含 `..`。
- 不能使用 Windows 盘符。
- 当前不支持 `checkpointId` 参数。

## profiles

Agent Profile 管理入口位于：

```js
const profiles = window.__TAURITAVERN__.api.agent.profiles;
```

方法：

```ts
type AgentProfilesApi = {
  list(): Promise<{ profiles: AgentProfileSummary[] }>;
  load(input: string | { profileId: string }): Promise<{ profile: AgentProfileDefinition | null }>;
  save(input: AgentProfileDefinition | { profile: AgentProfileDefinition }): Promise<void>;
  delete(input: string | { profileId: string }): Promise<void>;
};
```

Profile ID 必须使用小写 ASCII 字母、数字、`-` 或 `_`，长度不超过 128。

最小结构示例：

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

当前 Profile 边界：

- `model.mode` 只支持 `currentPromptSnapshot`。
- `preset.mode` 可以记录当前 prompt snapshot 或引用信息，但当前不会重写 prompt snapshot。
- `plan.mode` 当前只支持 `none`。
- 前台运行需要允许 `workspace.commit` 和 `workspace.finish`，否则无法正常提交并结束。
- `output.artifacts` 当前必须包含一个消息正文产物，目标为 `messageBody`。

## Commit 内部握手

聊天提交不是公开 Host API 方法。它由 Agent 工具和宿主桥接共同完成：

```text
模型调用 workspace.commit
  -> Rust runtime 写 chat_commit_requested event
  -> 前端 bridge 读取 workspace 文件
  -> bridge 调用 saveReply()
  -> bridge 写入 message.extra.tauritavern.agent
  -> bridge 调用 resolve_agent_chat_commit
```

提交元数据会写入消息的 `extra.tauritavern.agent`，包括：

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

扩展可以读取这些 metadata 来识别某条消息来自哪次 Agent run，但不应自行伪造提交。

## 错误语义

Agent API 倾向于明确失败，而不是静默回退普通生成。常见错误 code 或前缀包括：

| 错误 | 含义 |
| --- | --- |
| `agent.phase2b_chat_completion_required` | 当前不在支持的 chat-completion 路径 |
| `agent.external_tools_unsupported_phase2b` | prompt snapshot 已包含外部 tools |
| `agent.external_tool_turns_unsupported_phase2b` | prompt snapshot 已包含 tool turns |
| `agent.presentation_invalid` | `presentation` 不是 `foreground` 或 `background` |
| `agent.invalid_profile` | Profile 结构或策略无效 |
| `tool.policy_denied` | 请求了不可见或被禁止的工具 |
| `workspace.path_denied` | workspace 路径非法或不可见 |
| `workspace.required_artifact_missing` | 必要输出产物缺失 |
| `model.request_failed` | 模型请求失败 |
| `commit.save_failed` | 聊天保存失败 |

模型可修正的工具错误通常会作为工具结果回填给模型；宿主级错误会让 run 进入 failed 状态。

## 当前预留但未实现

以下方法当前会显式抛错：

| 方法 | 当前状态 |
| --- | --- |
| `approveToolCall()` | 审批流程尚未开放 |
| `listRuns()` | run 列表尚未开放 |
| `readDiff()` | diff 读取尚未开放 |
| `rollback()` | 回滚尚未开放 |

调用方不应捕获这些错误后假装能力可用。更稳妥的做法是将对应 UI 标为暂不可用。

## 相关页面

- 工具输入输出见 [Agent 工具参考](/api/agent-tools)。
- Skill 管理入口见 [Skill API](/api/skill)。
- 运行机制见 [Agent 系统架构](/architecture/agent)。
