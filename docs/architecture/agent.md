---
description: 从公开视角理解 TauriTavern Agent 的工作区运行时、工具循环、时间线和兼容边界。
---

# Agent 系统架构

TauriTavern 的 Agent 系统不是把普通生成加上一层更复杂的提示词，也不是把工具调用结果继续塞回聊天记录。它是一条新的创作路径：一次生成先进入一个受约束的工作区，Agent 在其中阅读、搜索、写入和修改文件，最后再把指定输出提交为聊天消息。

这页面向希望了解全局机制的用户、创作者和适配者。它不会要求你理解 TauriTavern 本体的 Rust 模块划分，但会说明哪些行为是当前可以依赖的公开边界。

[[toc]]

## 核心思想

传统 SillyTavern 生成大致是：

```text
整理上下文 -> 调用模型 -> 返回一段文本 -> 写入聊天
```

Agent 模式把这件事拆成更接近写作和编辑的过程：

```text
整理上下文
  -> 创建本次运行的工作区
  -> 模型根据配置档案看到工具、SKILLS 和工作区文件
  -> Agent 搜索、读取、写草稿、修改输出
  -> 提交输出文件到聊天
  -> 时间线保留过程记录
```

这个变化的重点在于“边界”。模型不是直接改聊天，也不能任意碰系统文件；它只能通过 TauriTavern 提供的工具在工作区内行动。所有关键步骤都会成为本次运行的事件。

## 三条生成路径

当前可以把 TauriTavern 的生成相关能力理解为三条路径：

| 路径 | 用途 | 边界 |
| --- | --- | --- |
| 普通生成 | 保持原有 SillyTavern 体验 | Agent Mode 关闭时走这条路径 |
| Agent 生成 | 多轮工具、工作区、时间线和提交 | 工具结果不写入聊天楼层 |
| 显式工具能力 | 后续给 MCP 或其它工具面板使用 | 不自动拥有 Agent 运行时 |

Agent Mode 关闭时，普通生成、上游事件和旧扩展语义应保持不变。Agent Mode 开启后，普通发送、重新生成和右划生成新候选会进入 Agent 路径；切换已有 swipe 候选仍保持原行为。

## 当前运行流程

当前最小可用阶段仍会借用原有 SillyTavern 前端流程来整理本轮上下文，然后交给 Rust Agent runtime 执行。

```text
用户发送消息
  ↓
前端执行 Legacy Generate dryRun
  ↓
捕获本轮 chat-completion payload 与最终激活的世界书快照
  ↓
启动 Agent run
  ↓
解析 Agent Profile
  ↓
创建 run workspace 与时间线 journal
  ↓
模型调用
  ↓
工具调用、工作区写入、checkpoint
  ↓
workspace.commit 请求提交聊天
  ↓
前端宿主桥接 saveReply 保存消息
  ↓
workspace.finish 结束运行
```

这里的 `dryRun` 只是兼容桥，不是长期架构的终点。它会触发原有 prompt 组织和世界书扫描，但不会执行最终模型请求。后续 TauriTavern 会逐步把更多上下文组装能力移动到结构化的 Agent 上下文中。

::: warning 当前兼容桥的含义
当前 Agent 需要 chat-completion 路径。它会拒绝已经带有外部 `tools`、`tool_choice`、`role: "tool"` 或 assistant `tool_calls` 的 prompt snapshot，因为 Agent 工具注册由 TauriTavern runtime 统一负责。
:::

## 身份与工作区

Agent 运行中有几个容易混淆的身份：

| 名称 | 含义 |
| --- | --- |
| `chatRef` | 当前可定位的聊天引用，例如角色聊天或群聊 |
| `stableChatId` | 聊天的长期稳定身份，用来跨重命名和导入保持一致 |
| `workspaceId` | 同一个稳定聊天对应的 Agent 工作区身份 |
| `runId` | 一次 Agent 运行的身份，每次发送、重新生成或新候选都会不同 |

同一段聊天可以有多次 Agent 运行。它们共享对话级的持久工作区，但每次运行都有独立的 run workspace、事件日志和输出文件。

## 工作区根目录

模型看到的是逻辑路径，不是系统文件路径。当前常用根目录如下：

| 根目录 | 用途 |
| --- | --- |
| `output/` | 最终输出。默认消息正文是 `output/main.md` |
| `scratch/` | 临时草稿、分析和整理 |
| `plan/` | 计划文件。完整 Plan Mode 尚未开放，但目录已保留 |
| `summaries/` | 摘要和阶段总结 |
| `persist/` | 同一聊天后续运行可以继续使用的持久信息 |

工作区路径必须是相对路径，不能包含 `..`、绝对路径、Windows 盘符或空字符。Agent 不能通过路径写法逃出工作区。

一些运行时文件不会暴露给模型直接读取，例如：

```text
input/
tool-args/
tool-results/
model-responses/
checkpoints/
events.jsonl
```

这些文件用于记录和恢复运行过程，而不是作为普通工作素材开放给模型。

## 上下文来源

当前 Agent 能接触的上下文主要来自这些位置：

| 来源 | 当前进入方式 |
| --- | --- |
| 当前生成 prompt | Legacy dryRun 捕获的 `promptSnapshot.chatCompletionPayload` |
| 聊天历史 | `chat.search` 与 `chat.read_messages` 工具按需读取 |
| 世界书 | 本次 dryRun 最终激活的世界书快照 |
| SKILLS | 配置档案允许后，通过 `skill.list`、`skill.search`、`skill.read` 按需读取 |
| 工作区文件 | 通过 workspace 工具读取、搜索、写入和修改 |
| 工具结果 | 作为 Agent 模型上下文的一部分回填下一轮，不写入聊天楼层 |

这保持了 SillyTavern 灵活 prompt 传统，同时避免把所有历史、所有 Skill 或所有工具结果一次性塞入模型上下文。

## Agent Profile

Agent Profile 是一次运行的策略。它不只是“选择哪个模型”。

当前 Profile 可以控制：

| 范围 | 当前能力 |
| --- | --- |
| 运行方式 | 前台或后台、模型瞬时错误重试、最大轮数 |
| 系统提示词 | 替换 Agent 默认运行说明 |
| 工具 | 允许、禁止、工具说明覆盖、总调用预算 |
| SKILLS | 可见 Skill、禁用 Skill、读取预算 |
| 工作区 | 可见根目录、可写根目录 |
| 输出 | 当前必须包含一个消息正文产物 |
| Plan | 当前只开放 `none`，其它模式会明确失败 |

当前模型和 API 仍跟随本轮 prompt snapshot；Profile 还不会自动切换 provider 或模型。`preset.ref` 目前主要用于校验和记录，不会重写本轮 prompt snapshot。

## 工具系统

Agent 工具有两个名称：

| 名称 | 用途 |
| --- | --- |
| Canonical name | TauriTavern 内部和配置档案使用，例如 `workspace.apply_patch` |
| Model-facing alias | 暴露给模型和 provider 的安全名称，例如 `workspace_apply_patch` |

工具调用不是聊天消息。一次工具调用会进入运行时间线，并把工具结果作为下一轮模型上下文的一部分。

工具错误分为两类：

| 类型 | 行为 |
| --- | --- |
| 模型可修正错误 | 以 `is_error = true` 的工具结果回填模型，例如路径不可见、参数缺失、patch 没有唯一匹配 |
| 宿主级错误 | 让运行失败，例如 journal 写入失败、checkpoint 失败、保存冲突、模型响应结构破坏 |

这种区分让 Agent 可以修正普通操作失误，同时不会在关键状态损坏时静默继续。

## 时间线与事件

每次 Agent run 都有按顺序追加的事件。用户界面里的时间线是这些事件的投影。

常见事件包括：

| 事件类别 | 示例 |
| --- | --- |
| 生命周期 | `run_created`、`run_completed`、`run_failed`、`run_cancelled` |
| 状态变化 | `status_changed` |
| 上下文 | `context_assembled` |
| 模型 | `model_request_created`、`model_completed`、`model_response_stored` |
| 工具 | `tool_call_requested`、`tool_call_completed`、`tool_call_failed` |
| 工作区 | `workspace_file_written`、`workspace_patch_applied` |
| 检查点 | `checkpoint_created` |
| 提交 | `chat_commit_requested`、`chat_commit_completed` |
| 持久信息 | `persistent_changes_committed` |

Provider 的流式 chunk 当前不是 Agent run event。Agent timeline 关注的是运行步骤，而不是把 provider 流式文本逐字投影出来。

## 提交到聊天

Agent 最终把工作区文件提交到聊天，而不是让模型文本直接变成消息。

默认提交路径是：

```text
output/main.md
```

提交由 `workspace.commit` 工具触发。当前支持两种模式：

| 模式 | 含义 |
| --- | --- |
| `replace` | 用指定文件替换本次运行的 Agent 消息内容 |
| `append` | 把指定文件内容追加到同一条 Agent 消息；首次 append 会创建消息 |

提交仍通过前端宿主桥接调用上游 `saveReply()`，遵守原有聊天保存队列和 windowed payload 语义。Rust 后端不会绕过聊天保存契约直接改 JSONL。

提交后，消息 `extra.tauritavern.agent` 会记录本次 Agent run 的标识、checkpoint、commit 和 artifact 摘要。聊天里只显示最终文本，过程细节保留在时间线和工作区里。

## 兼容性原则

当前 Agent 系统坚持这些边界：

- Agent Mode 关闭时，Legacy Generate 行为不变。
- Agent 工具结果不写入聊天楼层。
- Agent 事件不伪装成 SillyTavern 的 `GENERATION_*` 或 `TOOL_CALLS_*` 事件。
- 模型调用继续走 TauriTavern 现有 API 设置、密钥、日志和平台策略。
- 聊天提交继续走现有保存路径。
- 配置无效、路径越界、工具被拒绝时明确失败或返回可修正工具错误，不静默降级。

## 当前未开放能力

这些能力在设计上有位置，但当前不应作为公开可依赖能力使用：

| 能力 | 当前状态 |
| --- | --- |
| 完整 Plan Mode runtime | 仅保留 schema，当前只支持 `none` |
| Profile 自动切换模型 | 尚未开放 |
| MCP 工具 | 尚未接入 Agent 工具集 |
| shell 工具 | 当前不作为默认能力 |
| extension tool bridge | 尚未作为稳定能力开放 |
| `readDiff` | API 名称预留，当前会显式失败 |
| `rollback` | API 名称预留，当前会显式失败 |
| `approveToolCall` | API 名称预留，当前会显式失败 |
| resume-run / listRuns | 尚未作为用户能力开放 |

## 继续阅读

- 想看如何开启和使用：阅读 [Agent 快速开始](/agent/quick-start)。
- 想看可用工具的输入输出：阅读 [Agent 工具参考](/api/agent-tools)。
- 想接入 Host ABI：阅读 [Agent API](/api/agent)。
- 想管理 Skill 知识包：阅读 [Skill API](/api/skill)。
