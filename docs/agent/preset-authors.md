---
description: 面向 TauriTavern 预设作者的 Agent PromptManager 适配说明。
---

# 预设作者指南

这页写给已经熟悉预设、PromptManager 和提示词顺序的作者。

Agent Mode 并没有把预设作者从原有创作体系里移开。相反，它把预设中最有价值的一部分保留下来：你仍然可以决定上下文的组织顺序、角色信息的位置、世界书前后段落的关系，以及最终哪些说明靠近聊天历史。

变化在于，Agent 有两块专用的 PromptManager 组件：

```text
Agent System Prompt
Agent Results
```

它们都可以在预设顺序中移动。理解它们的含义，是让预设和 Agent Profile 配合稳定的关键。

## 先区分三层

预设、配置档案和 SKILLS 的职责不同：

| 层级 | 主要职责 |
| --- | --- |
| 预设 | 决定普通提示词和 Agent 专用位置块在上下文中的顺序 |
| Agent Profile | 决定 Agent 的系统提示词、工具、SKILLS、工作区权限、运行方式和输出策略 |
| SKILLS | 承载较长的写作方法、示例、格式规范和参考材料 |

一个温和的原则是：预设负责“放在哪里”，Profile 负责“允许做什么、应该怎样做”，SKILLS 负责“需要时读哪些材料”。

## Agent System Prompt

`Agent System Prompt` 在预设里是一个位置锚点，不是内容来源。

当 Agent Mode 启动时，前端会在这个位置放入一个内部 marker。后端 runtime 会把它替换为当前 Agent Profile 解析出的系统提示词。也就是说，真正的 Agent 系统提示词来自 Profile 的 `instructions.agentSystemPrompt`，而不是预设里这一块的文本。

这带来几个实际结论：

- 不要试图在预设的 `Agent System Prompt` 里编写正文说明。
- 需要修改 Agent 行为时，请修改或分发 Agent Profile。
- 这个位置必须存在。缺失时，Agent run 会明确失败，而不是悄悄退回别的行为。
- 旧预设如果没有这个位置，TauriTavern 会尽量补入默认引用。

默认顺序把它放在 `Main Prompt` 前面。这通常是稳妥选择，因为 Agent 的工作说明会先于普通主提示词进入上下文。

如果你确实需要调整，可以按意图移动：

| 放置方式 | 适合场景 |
| --- | --- |
| 靠前，接近 `Main Prompt` | 希望 Agent 工作说明先框定整轮写作任务 |
| 放在角色、世界书或人格之后 | 希望 Agent 先看到核心设定，再接收本配置的工作说明 |
| 靠近聊天历史之前 | 希望 Agent 的行动规则贴近本轮对话上下文 |

不建议频繁移动它。移动位置会改变 Profile 系统提示词和其它上下文的相对关系，最好每次只改一个因素，并用同一段聊天做对照测试。

## Agent Results

`Agent Results` 用来把过去已经提交到聊天中的 Agent 结果重新整理进新的 Agent prompt。

它不会把工具调用日志、草稿或隐藏工作区原样塞回上下文。它读取的是聊天消息上保存的 Agent 提交元数据和消息正文，并以系统消息形式放在 `Agent Results` 这个位置。

它的用途是让后续 Agent run 能知道：

- 哪些聊天消息来自 Agent。
- 当时的 `runId`、`workspaceId`、`checkpointId` 和提交信息。
- 过去提交到聊天中的最终内容。

`Agent Results` 可以移动，也可以在你明确不希望后续 Agent 看到过去 Agent 结果时关闭。

常见放置方式：

| 放置方式 | 适合场景 |
| --- | --- |
| 放在聊天历史附近 | 希望 Agent 把过去提交结果当作对话上下文的一部分 |
| 放在 Post-History Instructions 前 | 希望最终后置规则仍能约束 Agent 对历史结果的使用 |
| 关闭 | 玩法刻意避免历史 Agent 结果影响后续回复，或旧结果容易造成重复 |

`Agent Results` 会占用上下文预算。较长或较早的 Agent 结果可能因为预算不足而不进入本轮 prompt。这是正常的预算行为，不适合把它当成无限记忆。

需要长期保留的简短事实，应该交给 `persist/` 或之后开放的记忆机制；需要较长的写作规范，应该放进 SKILLS。

## 和 Agent Profile 的关系

预设和 Profile 的关系可以这样理解：

```text
预设决定 Profile 系统提示词插入 prompt 的位置。
Profile 决定这段系统提示词的内容，以及 Agent 能做什么。
```

Profile 中的 `instructions.agentSystemPrompt` 有两种常见状态：

| 值 | 含义 |
| --- | --- |
| `null` | 使用 TauriTavern runtime 默认 Agent 系统提示词 |
| 非空字符串 | 完整替换默认系统提示词 |

如果你想使用默认行为，请保持 `null`。如果你提供自定义提示词，请写成一段完整、可独立工作的说明，不要只写半句补丁式规则。

当前阶段，Profile 还不会替你切换模型或 provider。`model.mode` 仍跟随本轮原有 prompt snapshot，`preset` 引用更多用于记录和校验，而不是重写上下文。因此，预设作者在分发内容时，仍应提醒用户选择合适的 API、模型和上下文设置。

## 分发建议

如果一套预设专门适配 Agent，建议同时提供：

- 预设本体。
- 推荐的 Agent Profile。
- 与 Profile 配套的 SKILLS。
- 一小段说明：Agent Mode 关闭时如何使用，Agent Mode 开启时应选择哪个 Profile。

不要假设用户已经安装了同名 Profile 或 Skill。更稳妥的做法是在说明里写清楚依赖，并让普通预设在 Agent Mode 关闭时仍能工作。

## 发布前检查

发布前可以用这张表做一次快速确认：

| 检查项 | 期待结果 |
| --- | --- |
| Agent Mode 关闭 | Agent 专用块不会影响普通生成 |
| Agent System Prompt | 位置存在，未被删除，顺序符合你的设计 |
| Agent Results | 位置符合预期；如果关闭，是有意为之 |
| Profile | `instructions.agentSystemPrompt` 已写在 Profile 中，而不是写在预设 marker 中 |
| SKILLS | 长素材没有堆进系统提示词，Agent 能按需读取 |
| 工具策略 | Profile 允许的工具和系统提示词要求一致 |

预设作者不需要把 Agent 做成另一套复杂系统。最好的适配往往只是两个清楚的位置、一个边界明确的 Profile，以及几份可读的 Skill 材料。
