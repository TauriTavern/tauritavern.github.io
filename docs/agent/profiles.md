---
description: 理解和管理 TauriTavern Agent Profile。
---

# Agent 配置档案

Agent Profile 用来描述一个 Agent 如何运行。它是Agent的实际运行策略：用哪套预设组织上下文、调用哪个模型、能看见哪些工具和 SKILLS、是否允许被其它 Agent 调用、工作区里哪些目录可见可写，以及最终如何把内容提交到聊天。

普通用户只需要先选好当前 Profile。创作者再根据任务需要复制、调整和分发自己的 Profile。

## 内置配置

TauriTavern 提供内置配置：

```text
default-writer
```

它是通用写作者配置，适合普通聊天和创作尝试。它可以读取聊天、世界书、SKILLS 和工作区，也可以在允许的情况下把任务委派给其它 SubAgent。

内置配置不能直接编辑或删除。如果你想修改它，请先复制一份，再在副本上调整。

## 当前 Profile 与正在编辑的 Profile

Agent 系统面板里有两个容易混淆的概念：

| 项目 | 含义 |
| --- | --- |
| `Active Profile` | 下一次 Agent 运行实际使用的 Profile |
| 正在编辑的 Profile | 你当前在面板中查看或修改的 Profile |

编辑某个 Profile 不会自动把它设为当前运行 Profile。运行前请确认 `Active Profile` 指向你想使用的配置。

只允许作为 SubAgent 的 Profile 不会出现在 `Active Profile` 列表中。如果当前 Profile 被改成“仅作为 SubAgent”，系统会把当前运行 Profile 重置回 `default-writer`，避免下一次生成无法启动。

## 管理入口

打开 Agent 系统面板后，可以在 `配置档案` 页中：

- 新建配置。
- 复制现有配置。
- 保存配置。
- 导出配置。
- 删除自定义配置。
- 在表单和高级 JSON 之间切换查看。

表单适合日常调整。高级 JSON 适合备份、迁移或检查完整字段。若不确定某个字段含义，建议优先使用表单。

## 身份信息

| 字段 | 说明 |
| --- | --- |
| 配置 ID | 稳定标识。建议使用小写字母、数字、`-` 和 `_` |
| 显示名称 | 面板里展示给用户看的名称 |
| 描述 | 说明这个配置适合什么任务 |

配置 ID 应尽量稳定。创作者分发配置时，不建议频繁改 ID，否则用户很难判断新旧配置是否是同一套策略。

## 预设绑定

Preset 决定 Agent 运行时如何组织 prompt。Profile 现在可以选择三种方式：

| 模式 | 适合场景 |
| --- | --- |
| 跟随当前生成快照 | 使用当前聊天里已经整理好的上下文，最接近普通生成 |
| 引用指定预设 | 让这个 Profile 固定使用某个预设来组装 Agent prompt |
| 不绑定预设 | 不引用固定预设，适合少数后台或专用任务 |

如果你希望一个 Agent 始终按某套预设工作，可以选择“引用指定预设”。这样用户切换聊天里的普通预设时，不会意外改变这个 Agent 的 prompt 组织方式。

当前独立预设组装主要面向 OpenAI/chat-completion 预设。若引用的预设不满足运行要求，Agent 会明确失败。

## 模型绑定

Model 决定 Agent 实际调用哪个模型。Profile 支持：

| 模式 | 含义 |
| --- | --- |
| 跟随当前生成快照 | 使用本轮普通生成捕获到的模型和连接 |
| 绑定模型连接 | 使用 Profile 中指定的[已在API连接配置中保存的模型](/agent/faq#agent-profile-model-from-api-connection) |
| 需要重新配置 | 这个 Profile 被导入或分发后，需要用户在本机[重新选择模型](/agent/faq#agent-profile-model-from-api-connection) |

独立模型适合这些场景：

- 主聊天使用一个模型，Agent 使用另一个更适合工具调用的模型。
- 主 Agent 使用较强模型，SubAgent 使用更快或更便宜的模型。
- 创作者分发 Profile 时，不希望把自己的本机连接或密钥信息带给用户。

导出的 Profile 不会携带本机模型连接。接收者导入后，如果看到“需要重新配置”，只要在 Profile 里[重新选择可用模型](/agent/faq#agent-profile-model-from-api-connection)即可。

## 运行策略

运行策略决定一次 Agent run 的基本行为。

| 字段 | 含义 |
| --- | --- |
| 呈现方式 | 前台运行需要提交聊天消息；后台运行可用于不直接写聊天的任务 |
| 规划模式 | 当前主要开放 `无`；更完整的 Plan Mode 属于后续能力 |
| 最大轮数 | 模型和工具循环的最大轮数 |
| 最大工具调用数 | 本次运行中允许的工具调用总量 |
| 模型重试次数 | 瞬时模型错误的重试次数 |
| 重试间隔 | 两次重试之间的等待时间 |

::: tip
对于普通创作，建议先保留默认轮数。过低会让 Agent 来不及阅读和提交，过高则可能增加等待时间和消耗。
:::

## 初始上下文

Profile 可以控制 Agent 一开始带入多少聊天历史。

| 设置 | 含义 |
| --- | --- |
| `-1` | 跟随当前 prompt 组装结果，不剪裁聊天历史 |
| `0` | 不主动带入聊天历史，适合非常专用的后台任务 |
| 正整数 | 最多带入最近 N 条聊天消息 |

它还可以决定是否包含本轮激活的世界书。对于普通写作，通常建议保留世界书；对于只做格式检查、摘要或资料整理的 SubAgent，可以按任务收窄。

## SubAgent 与委派

Profile 的SubAgent策略决定它能不能调用其它 Agent，也决定它能不能被其它 Agent 调用。

| 设置 | 含义 |
| --- | --- |
| 允许生成子 Agent | 这个 Agent 可以使用 `agent.delegate` 发起子任务 |
| 可作为 SubAgent | 它可以以“任务返回”模式在后台运行 |
| 允许的调用者 | 限制哪些 Profile 可以调用它，`*` 表示不限制 |
| 最大并发子任务 | 同一运行中同时进行的子任务数量 |
| 每次运行最多子任务 | 同一运行中可以发起的子任务总数 |
| 结果预算 | 子任务结果返回给父 Agent 时的预算 |

如果一个 Profile 只想作为 SubAgent 使用，应勾选允许作为 SubAgent并保存。更多说明见 [SubAgent](/agent/subagents)。

## Agent 系统提示词

`Agent 系统提示词` 是给 Agent 的运行说明。它适合描述：

- 本配置的写作目标。
- 什么时候应搜索历史。
- 如何使用 SKILLS。
- 是否可以将任务委派给 SubAgent。
- 输出应写入哪个文件。
- 哪些内容应保持克制或避免。

它不适合堆入大量世界观正文。大段素材更适合放进 SKILLS，由 Agent 按需读取。

如果希望角色以更短、更自然的对话节奏回复，可以在系统提示词中明确说明：

```text
如果本轮更适合短对话，请把回复拆成数段简短内容，并用 append 提交逐段补充。不要为了凑长回复而展开过多解释。
```

这类提示适合闲聊、轻量角色互动和偏日常的场景。对于需要一次性完整呈现的正文、状态栏或格式化输出，仍建议使用普通提交，保持结构稳定。

## 能力矩阵

能力矩阵决定模型能看到哪些工具。当前内建工具大致分为这些类别：

| 类别 | 工具 |
| --- | --- |
| Agent 协作 | `agent.list`、`agent.delegate`、`agent.await`、`task.return` |
| 聊天 | `chat.search`、`chat.read_messages` |
| 世界书 | `worldinfo.read_activated` |
| SKILLS | `skill.list`、`skill.search`、`skill.read` |
| 工作区读取 | `workspace.list_files`、`workspace.search_files`、`workspace.read_file` |
| 工作区写入 | `workspace.write_file`、`workspace.apply_patch` |
| 聊天提交 | `workspace.commit`、`workspace.finish` |
| 随机数 | `dice.roll` |

如果一个工具没有被允许，Agent 通常看不到它，也不能依赖它完成任务。前台运行一般应保留 `workspace.commit` 和 `workspace.finish`，否则 Agent 无法把最终内容提交并结束。

`task.return` 是 SubAgent 运行时使用的返回工具，不会手动放进普通 Profile 的工具列表。`dice.roll` 需要明确允许后才适合用于桌游、检定或随机事件。

短对话式回复也依赖 `workspace.commit`。区别在于提交时使用追加模式，让同一次运行可以多次补充消息内容。

## SKILLS 访问

Profile 可以限制 Agent 能读取哪些 SKILLS。

| 字段 | 说明 |
| --- | --- |
| 可用 SKILLS | 允许读取的 Skill 名称。`*` 表示全部可见 |
| 禁用 SKILLS | 明确禁止读取的 Skill 名称 |
| 每次调用最多字符 | 单次读取 Skill 文件的最大字符数 |
| 每次运行最多字符 | 本次运行读取 Skill 的总字符预算 |

禁用优先于允许。也就是说，即使可用 SKILLS 写了 `*`，被禁用的 Skill 仍不可见。

2.1.0 中，Skill 还可以属于不同作用域：全局、预设、Profile 或角色。Agent 会先解析当前运行相关的 Skill，再按 Profile 的可见和禁用规则做最后筛选。

## 工作区访问

工作区访问分为 `可见` 和 `可写`。

| 根目录 | 建议用途 |
| --- | --- |
| `output` | 最终回复和其它输出产物 |
| `scratch` | 临时草稿和分析笔记 |
| `plan` | 计划文件 |
| `summaries` | 摘要、阶段总结和子任务结果 |
| `persist` | 同一聊天后续运行需要保留的信息 |

可写目录必须先可见。若某个目录不可见，Agent 不能读取它；若不可写，Agent 不能修改它。

SubAgent 会看到经过收窄的任务工作区。它可以读取父 Agent 提供的任务说明和摘要，也可以把结果写回约定的摘要位置，但不能随意接管父 Agent 的前台提交。

## 输出产物

当前用户可见的主要输出产物是消息正文。默认路径是：

```text
output/main.md
```

如果你修改消息正文路径，需要同时保证 Agent 系统提示词、工作区权限和提交工具能够指向同一个路径。否则 Agent 可能写了文件，却无法把正确内容提交到聊天。

## 导出与分发

创作者分发 Profile 时，建议提前说明：

- 这个 Profile 是主 Agent，还是只适合作为 SubAgent。
- 是否需要用户[重新绑定模型](/agent/faq#agent-profile-model-from-api-connection)。
- 是否依赖某个预设、角色或 Skill。
- 是否需要 `agent.delegate`、`dice.roll` 等默认不一定开放的工具。

导出的 Profile 会尽量避免携带本机连接信息。用户导入后[重新选择模型](/agent/faq#agent-profile-model-from-api-connection)，是正常流程，不表示配置损坏。

## 维护建议

创作者维护 Profile 时，可以遵循几条简单规则：

- 一个 Profile 只服务一种主要工作流。
- 先收窄工具，再按需要放开。
- 能写进系统提示词的规则保持简短，长素材放进 SKILLS。
- SubAgent 用来处理清晰、局部、可返回结果的任务，不要为了复杂而复杂。
- 导出前用一个干净聊天做一次最小验证。
