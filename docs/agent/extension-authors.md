---
description: 面向 TauriTavern 扩展作者的 Agent 后台工作流与 persist 使用建议。
---

# 扩展作者指南

这页写给希望从扩展中调用 Agent 能力的作者。它讨论的是公开 Host ABI 的使用方式，不要求你依赖 Rust 后端内部结构。

扩展适配 Agent 时，最重要的不是“启动一个模型请求”，而是选择合适的运行形态：这次工作是否应该写入聊天？是否只是整理背景资料？结果是否需要被同一聊天的后续 Agent run 继续看到？

## 前台和后台

Agent run 有两种呈现方式：

| 呈现方式 | 适合场景 |
| --- | --- |
| `foreground` | 生成用户可见回复，必须在结束前至少成功 `workspace.commit` 一次 |
| `background` | 整理摘要、维护持久信息、预处理资料，可以不提交聊天消息 |

扩展如果只是想更新状态、整理摘要或维护 `persist/`，通常应使用后台运行。这样不会往聊天里额外插入消息，也更符合用户对“后台工作”的直觉。

::: tip
请求参数里的 `presentation` 和 Profile 的 `run.presentation` 建议保持一致。这样用户在面板里查看 Profile 时，也能理解这套工作流原本是前台还是后台任务。
:::

## 启动后台 Agent 工作流

扩展应从公开入口调用：

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

`startRunFromLegacyGenerate()` 会复用当前聊天的原有 prompt 组织、世界书扫描和 chat-completion 上下文，再把结果交给 Agent runtime。它是当前最适合普通扩展的入口。

当前需要注意：

- 只面向当前 active chat。
- 当前要求 chat-completion 路径。
- `stream` 必须为 `false` 或省略。
- 不能混用 Legacy ToolManager external tools。
- 参数无效时会明确失败，不会静默退回普通生成。

后台工作流本身应写在对应的 Agent Profile 中，而不是散落在扩展代码里。例如，一个 `memory-summarizer` Profile 的系统提示词可以这样写：

```text
你是当前聊天的后台整理 Agent。

请读取 persist/summary.md 中已有的持久摘要；如不存在，可以创建它。
按需搜索最近聊天，整理重要但简短的剧情事实、关系变化和未解决线索。
把更新后的内容写回 persist/summary.md。
不要提交聊天消息。完成后调用 workspace.finish。
```

扩展负责启动和观察，Profile 负责描述任务。这样用户更容易检查和调整工作流。

## 订阅运行事件

启动后，扩展可以订阅事件：

```js
const terminalEvents = new Set(['run_completed', 'run_failed', 'run_cancelled']);

const stop = agent.subscribe(run.runId, event => {
  console.log(event.type, event.payload);

  if (terminalEvents.has(event.type)) {
    stop();
  }
});
```

事件按 `seq` 递增。扩展只需要识别自己关心的事件，不要假设事件类型永远只有当前文档列出的那些。

常见做法：

- 用 `run_created`、`profile_resolved`、`workspace_initialized` 更新 UI 状态。
- 用 `tool_call_requested`、`tool_call_completed` 展示简要进度。
- 用 `run_completed` 标记完成。
- 用 `run_failed` 显示可理解的错误。
- 用 `run_cancelled` 收起或标记用户取消。

如果需要读取本次 run 中的文本文件，可以使用：

```js
const file = await agent.readWorkspaceFile({
  runId: run.runId,
  path: 'persist/summary.md',
});

console.log(file.text);
```

这个接口只读取本次 run workspace 中的 UTF-8 文本文件。模型侧读取文件仍应使用 `workspace.read_file` 工具。

## 使用 persist

`persist/` 是同一稳定聊天下的持久工作区。每次 Agent run 启动时，当前聊天已有的 `persist/` 内容会进入本次 run 的工作区；本次 run 对 `persist/` 的修改，只有在 `workspace.finish` 成功后才会回写到稳定聊天工作区。

这带来一个清楚边界：

| run 结果 | `persist/` 变化 |
| --- | --- |
| `workspace.finish` 成功 | 成功变更会写回稳定聊天工作区 |
| run failed | 不写回 |
| run cancelled | 不写回 |

适合放进 `persist/` 的内容：

- `persist/summary.md`：简短剧情摘要。
- `persist/open-threads.md`：未解决线索。
- `persist/preferences.md`：用户明确表达过的写作偏好。
- `persist/relationships.md`：角色关系变化。

不适合放进 `persist/` 的内容：

- 完整聊天记录。
- 模型推理过程。
- 原始工具结果。
- 一次性草稿。
- 用户没有同意保存的敏感信息。

如果 Profile 没有把 `persist` 放进 `workspace.visibleRoots` 和 `workspace.writableRoots`，Agent 就不能读取或修改它。扩展作者分发后台 Profile 时，应确认工作区权限和系统提示词一致。

## 取消和回滚

扩展可以调用：

```js
await agent.cancel(run.runId);
```

取消会请求 run 停止，并尽力取消正在进行的模型或工具调用。取消不是回滚：

- 已经提交到聊天的内容不会自动删除。
- 已经成功 finish 的 `persist/` 变更不会因为之后的 UI 状态变化而撤销。
- 未成功 finish 的后台 run 不会把 `persist/` 写回稳定工作区。

当前公共 API 中的 `listRuns()`、`readDiff()`、`rollback()`、`approveToolCall()` 仍是预留能力，调用会明确抛错。扩展不应捕获这些错误后假装能力可用；更稳妥的做法是在 UI 中标记为暂不可用。

## 维护建议

扩展作者可以把 Agent 集成保持得很轻：

- 使用 `window.__TAURITAVERN__.api.agent`，不要直接调用 Tauri command 或内部模块。
- 用专门的后台 Profile 描述任务，不把关键指令藏在扩展代码里。
- 后台任务默认不提交聊天，除非用户明确触发了可见输出。
- `persist/` 只保存后续运行确实需要的短信息。
- 对不支持的路径明确提示，不要悄悄切回普通生成。

这样扩展、Profile 和用户界面之间的边界会比较清楚。用户可以看见 Agent 做了什么，创作者也更容易维护这套工作流。
