---
description: TauriTavern Agent 当前内建工具的名称、用途、输入参数、结果语义和限制。
---

# Agent 工具参考

Agent 工具是模型在受约束工作区中行动的方式。它们可以读取聊天、查看本轮世界书激活结果、按需读取 SKILLS、操作工作区文件、委派 SubAgent，并在完成时提交输出。

工具调用属于 Agent run event，不会写成聊天楼层。聊天里只保存最终提交的内容。

[[toc]]

## 名称与可见性

每个工具有两个名称：

| 名称 | 示例 | 用途 |
| --- | --- | --- |
| Canonical name | `workspace.apply_patch` | 配置档案、时间线和文档中使用 |
| Model-facing alias | `workspace_apply_patch` | 提供给模型和 provider 的函数名 |

配置档案使用 canonical name 控制工具可见性。即使模型设法请求未开放工具，dispatcher 也会再次拦截。

## 通用规则

- 未被当前 Profile 允许的工具，模型通常看不到，也不能依赖。
- 只读工具不会修改聊天和工作区。
- 写入或修改工作区成功后会创建 checkpoint。
- 工具参数和结果会记录到本次 run 的工作区中。
- 大结果不应直接进入聊天；它们作为工具结果和资源引用进入后续模型上下文。
- 工具结果不会触发 SillyTavern 旧的工具消息楼层。
- 子任务工具仍受父 Agent 和目标 Profile 的预算限制。

工具错误分两种：

| 类型 | 行为 |
| --- | --- |
| 可恢复工具错误 | 返回 `is_error = true` 的工具结果，让模型有机会修正 |
| 运行时失败 | run 进入 failed，例如 journal、checkpoint、保存或模型响应结构出错 |

## 当前工具总览

| 类别 | Canonical name | Model alias | 用途 |
| --- | --- | --- | --- |
| Agent 协作 | `agent.list` | `agent_list` | 查找当前可调用的 Agent |
| Agent 协作 | `agent.delegate` | `agent_delegate` | 向另一个 Agent 发起子任务 |
| Agent 协作 | `agent.await` | `agent_await` | 等待或检查子任务结果 |
| Agent 协作 | `task.return` | `task_return` | SubAgent 返回任务结果并结束子任务 |
| 聊天 | `chat.search` | `chat_search` | 搜索当前聊天 |
| 聊天 | `chat.read_messages` | `chat_read_messages` | 按消息索引读取聊天内容 |
| 世界书 | `worldinfo.read_activated` | `worldinfo_read_activated` | 读取本轮激活的世界书条目 |
| SKILLS | `skill.list` | `skill_list` | 列出可见 Skill 摘要 |
| SKILLS | `skill.search` | `skill_search` | 搜索单个 Skill 内文本文件 |
| SKILLS | `skill.read` | `skill_read` | 读取 Skill 文件或范围 |
| 工作区 | `workspace.list_files` | `workspace_list_files` | 列出可见工作区文件 |
| 工作区 | `workspace.search_files` | `workspace_search_files` | 搜索可见工作区文本文件 |
| 工作区 | `workspace.read_file` | `workspace_read_file` | 读取工作区文本文件 |
| 工作区 | `workspace.write_file` | `workspace_write_file` | 写入或追加 UTF-8 文件 |
| 工作区 | `workspace.apply_patch` | `workspace_apply_patch` | 对单个文件做精确替换 |
| 控制 | `workspace.commit` | `workspace_commit` | 提交工作区文件到聊天 |
| 控制 | `workspace.finish` | `workspace_finish` | 结束本次 Agent run |
| 随机数 | `dice.roll` | `dice_roll` | 掷骰，用于明确需要随机性的任务 |

当前没有 MCP、shell、extension bridge 或用户可用的 `agent.handoff` 工具。

## agent.list

列出当前 Agent 可以请求帮助的其它 Agent。它是只读工具，不会启动子任务。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `purpose` | string | 否 | `any`、`delegate` 或 `handoff`，默认 `any` |
| `query` | string | 否 | 按 Agent ID、显示名称或描述过滤 |
| `limit` | integer | 否 | 最大返回数，默认 8，最大 20 |

当前主要使用 `delegate` 场景。`handoff` 作为枚举保留，不表示已经开放了用户可用的 handoff 工具。

结果会返回可调用 Agent 的 ID、显示名称、描述和适用信息。目标是否可见，还取决于目标 Profile 的 `callable`、`allowAsSubagent` 和允许调用者设置。

## agent.delegate

向另一个 Agent 发起一个聚焦子任务。调用后，父 Agent 可以继续工作，也可以用 `agent.await` 等待结果。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `agentId` | string | 是 | 来自 `agent.list` 的目标 Agent ID |
| `task` | object | 是 | 子任务说明 |
| `task.objective` | string | 是 | 需要完成的目标 |
| `task.title` | string | 否 | 简短任务名，用于显示 |
| `task.context` | object | 否 | 相关事实、限制、草稿、文件路径等 |
| `task.expectedOutput` | object | 否 | 期望返回形态，例如摘要、检查结果或产物引用 |
| `budget` | object | 否 | 可选子任务预算 |
| `budget.maxRounds` | integer | 否 | 子任务最大轮数，不能超过目标 Profile 上限 |
| `budget.maxToolCalls` | integer | 否 | 子任务最大工具调用数，不能超过目标 Profile 上限 |

限制：

- 当前 Agent 必须允许生成子 Agent。
- 目标 Profile 必须可被调用，并允许作为 SubAgent。
- 目标 Profile 的模型必须[已配置完成](/agent/faq#agent-profile-model-from-api-connection)。
- 调用者必须在目标 Profile 允许的调用者范围内。
- 委派数量和并发数量受父 Agent Profile 限制。

好的 `objective` 应描述结果，而不是只写步骤。例如“检查 `output/main.md` 是否符合角色语气，并返回最多 5 条具体问题”通常比“读文件，然后分析，然后告诉我”更好。

## agent.await

等待或检查父 Agent 已经发起的子任务。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `taskIds` | array | 否 | 要等待的任务 ID。省略时作用于本轮已发起的任务 |
| `mode` | string | 否 | `nextCompleted`、`allCompleted` 或 `statusOnly`，默认 `nextCompleted` |
| `timeoutMs` | integer | 否 | 等待超时，默认 120000，最大 300000 |

模式含义：

| 模式 | 含义 |
| --- | --- |
| `nextCompleted` | 等到任意一个选中任务完成 |
| `allCompleted` | 等到所有选中任务完成 |
| `statusOnly` | 只查看状态，不等待 |

只能等待当前父 invocation 自己发起的任务。超时会返回当前状态和提示，不代表所有子任务都失败。

## task.return

SubAgent 用它返回任务结果并结束子任务。这个工具只会出现在子任务运行时，普通主 Agent 不应直接使用。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `summary` | string | 是 | 给父 Agent 的简洁结果摘要 |
| `status` | string | 否 | `completed` 或 `failed`，默认 `completed` |
| `confidence` | string | 否 | `low`、`medium` 或 `high` |
| `artifacts` | array | 否 | 子任务产物引用 |
| `artifacts[].path` | string | 是 | 子任务可见的工作区路径 |
| `artifacts[].kind` | string | 是 | 产物格式，例如 `markdown`、`json`、`text` |
| `artifacts[].role` | string | 是 | 建议用途，例如 `draft`、`outline`、`evidence` |
| `findings` | array | 否 | 结构化发现 |
| `warnings` | array | 否 | 需要父 Agent 注意的问题 |
| `suggestedNextActions` | array | 否 | 建议父 Agent 接下来做什么 |
| `questionsForCaller` | array | 否 | 仍需父 Agent 或用户补充的问题 |

返回后，runtime 会把结果记录到子任务结果文件和摘要路径中，父 Agent 可以通过 `agent.await` 看到结果。

## chat.search

搜索当前 run 绑定的聊天。不能指定其它聊天目标。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `query` | string | 是 | 搜索文本 |
| `limit` | integer | 否 | 最大命中数，默认 20，最大 50 |
| `role` | string | 否 | `user`、`assistant` 或 `system` |
| `start_message` | integer | 否 | 起始 0-based 消息索引 |
| `end_message` | integer | 否 | 结束 0-based 消息索引 |
| `scan_limit` | integer | 否 | 限制最近扫描消息数量 |

结果会返回消息索引、角色、片段和引用。0 命中是正常结果，不是错误。

适合场景：

- 回看较长聊天历史。
- 先定位关键词，再用 `chat.read_messages` 读取完整消息或片段。

## chat.read_messages

按 0-based 消息索引读取当前聊天内容。JSONL header 不计入消息索引。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `messages` | array | 是 | 要读取的消息列表 |
| `messages[].index` | integer | 是 | 0-based 消息索引 |
| `messages[].start_char` | integer | 否 | 单条消息内的 0-based 字符偏移 |
| `messages[].max_chars` | integer | 否 | 最多读取字符数 |

限制：

- 单次最多读取 20 条消息。
- 单条完整读取上限 8000 字符。
- 分段读取单条消息时单段上限 8000 字符。
- 单次调用总返回上限 20000 字符。

如果消息索引不存在、范围非法或读取过大，会返回可恢复工具错误。

## worldinfo.read_activated

读取本次 Agent run 捕获的最终激活世界书条目。它读取的是本次 prompt snapshot 中 materialized 的激活结果，不读取全局 last activation。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entries` | array | 否 | 省略时只列出激活条目引用，不返回正文 |
| `entries[].ref` | string | 是 | 索引调用返回的条目引用 |
| `entries[].start_char` | integer | 否 | 条目正文内 0-based 字符偏移 |
| `entries[].max_chars` | integer | 否 | 最多读取字符数，最大 8000 |

限制：

- 单次最多读取 20 个条目。
- 单条完整读取上限 8000 字符。
- 单次总返回上限 20000 字符。

推荐用法是先无参数调用查看激活条目，再按需要读取具体条目。

## skill.list

列出当前 Profile 可见的已安装 Skill 摘要。

输入：

```json
{}
```

结果包含 Skill 名称、描述和索引摘要，不会读取 `SKILL.md` 全文。

可见性由作用域和 Profile 共同决定：

- Agent 会解析当前运行相关的全局、预设、Profile、角色 Skill。
- `skills.visible` 决定最终可见范围。
- `skills.deny` 优先于 visible。
- `visible: ["*"]` 表示全部已解析 Skill 可见，但仍受 deny 影响。

## skill.search

搜索单个可见 Skill 内的 UTF-8 文本文件。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | Skill 名称，来自 `skill.list` |
| `query` | string | 是 | 搜索文本 |
| `path` | string | 否 | Skill 内相对文件或目录路径 |
| `limit` | integer | 否 | 最大命中数，默认 20，最大 50 |
| `context_lines` | integer | 否 | 每个命中的上下文行数，默认 2，最大 5 |

结果返回 snippet 和 ref。snippet 字符数会计入本次运行的 Skill 读取预算，避免绕过 `skill.read` 的预算限制。

不可见 Skill、非法路径、二进制文件、预算耗尽等会返回可恢复工具错误。

## skill.read

读取可见 Skill 内的 UTF-8 文本文件或范围。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | Skill 名称 |
| `path` | string | 否 | Skill 内相对路径，默认 `SKILL.md` |
| `max_chars` | integer | 否 | 最多返回字符数，默认 20000，最大 80000 |
| `start_line` | integer | 否 | 1-based 起始行 |
| `line_count` | integer | 否 | 读取行数 |
| `start_char` | integer | 否 | 0-based 字符偏移 |

行范围和字符范围不能混用。Skill 原始文件是只读资源；如果 Agent 需要摘录、总结或改写，应写入 `scratch/`、`summaries/` 或 `output/`。

## workspace.list_files

列出当前模型可见的工作区文件。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 否 | 相对目录或文件路径，省略时列出可见根 |
| `depth` | integer | 否 | 列出深度，默认 2，最大 4 |

当前可见根目录由 Profile 收窄，常见为：

```text
output/
scratch/
plan/
summaries/
persist/
```

`path` 省略、空字符串、`.`、`./` 都表示工作区 root。

## workspace.search_files

搜索当前可见工作区中的 UTF-8 文本文件。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `query` | string | 是 | 搜索文本 |
| `path` | string | 否 | 限定文件或目录路径 |
| `limit` | integer | 否 | 最大命中数，默认 20，最大 50 |
| `context_lines` | integer | 否 | 上下文行数，默认 2，最大 5 |

它只搜索模型可见的工作区根，不搜索隐藏运行目录，例如 `input/`、`tool-results/`、`model-responses/`、`checkpoints/` 或 `events.jsonl`。

0 命中是正常结果。

## workspace.read_file

读取当前可见工作区中的 UTF-8 文本文件。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 相对工作区文件路径，必须是文件，不是目录 |
| `start_line` | integer | 否 | 1-based 起始行 |
| `line_count` | integer | 否 | 读取行数 |
| `start_char` | integer | 否 | 0-based 字符偏移 |
| `max_chars` | integer | 否 | 最多返回字符数，最大 80000 |

读取结果带行号。使用 `workspace.apply_patch` 时，`old_string` 不应包含这些行号前缀。

建议先读取要修改的准确文本。如果 patch 失败，再完整读取文件后重试。

## workspace.write_file

写入 UTF-8 文本到可写工作区路径。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 相对工作区路径，必须位于可写根内 |
| `content` | string | 是 | replace 时为完整文件内容，append 时为要追加的文本 |
| `mode` | string | 否 | `replace` 或 `append`，默认 `replace` |

语义：

- `replace` 写完整文件。
- `append` 把 `content` 原样追加到文件末尾；如果希望换行，需要在 `content` 中包含换行。
- 文件不存在时，append 会创建文件。

写入成功后会记录 read-state，并创建 checkpoint。

适合：

- 创建 `output/main.md`。
- 写临时草稿到 `scratch/`。
- 写后续运行需要的简短信息到 `persist/`。
- 在 `summaries/` 中记录阶段摘要或子任务摘要。

不适合：

- 写系统文件。
- 写工作区外路径。
- 修改已安装 Skill。

## workspace.apply_patch

对单个工作区文件做精确字符串替换。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 相对可写工作区文件路径 |
| `old_string` | string | 是 | 要替换的精确文本 |
| `new_string` | string | 是 | 替换后的文本 |
| `replace_all` | boolean | 否 | 是否替换所有匹配，默认 `false` |

要求：

- `old_string` 应来自已经读取过的文本，或来自本次 run 创建、替换过的文件。
- `old_string` 不应包含 `workspace.read_file` 返回时的行号前缀。
- 默认要求 `old_string` 精确且唯一匹配。
- 0 次匹配、多次匹配、版本变化等会返回可恢复工具错误。

成功后会创建 checkpoint。

## workspace.commit

把可见工作区文本文件提交到当前聊天消息。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 否 | 要发布的工作区文件，默认 `output/main.md` |
| `mode` | string | 否 | `replace` 或 `append`，默认 `replace` |
| `reason` | string | 否 | 简短提交原因 |

语义：

- `replace` 会覆盖本次 run 对应的 Agent 消息内容。
- `append` 会把文件内容追加到同一条 Agent 消息；如果本 run 尚未提交过，会先创建消息。
- 前台 run 在 `workspace.finish` 前必须至少成功 commit 一次。
- 后台 run 可以不提交聊天消息。

提交由前端宿主桥接执行，仍走上游 `saveReply()` 和聊天保存队列。

## workspace.finish

结束本次 Agent run。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reason` | string | 否 | 简短完成原因 |

前台 run 如果尚未成功 `workspace.commit`，调用 finish 会失败。后台 run 可以无提交完成。

`workspace.finish` 成功后，本次 run 会进入收尾阶段，并把 `persist/` 的成功变更 promote 回稳定聊天工作区。失败或取消的 run 不会写回持久工作区。

## dice.roll

掷骰工具，用于明确需要随机性的任务，例如桌游、角色扮演检定或随机事件。它是只读工具，但结果不是幂等的；同样参数每次可能得到不同结果。

输入：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `formula` | string | 是 | 骰子表达式，例如 `d6`、`1d20`、`3d6+4`、`2d10-1`，或纯数字 `20` 表示 `1d20` |

如果任务不需要随机性，不建议开放这个工具。默认写作型 Profile 通常不需要它。

## Profile 中的工具配置

Profile 使用 canonical name 控制工具：

```json
{
  "tools": {
    "allow": [
      "agent.list",
      "agent.delegate",
      "agent.await",
      "chat.search",
      "chat.read_messages",
      "skill.list",
      "skill.search",
      "skill.read",
      "worldinfo.read_activated",
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
    "maxCallsPerRun": 80,
    "maxCallsPerTool": {
      "chat.search": 8
    }
  }
}
```

`deny` 优先于 `allow`。如果系统提示词要求使用某个被禁用工具，Agent 通常会失败或反复收到可恢复工具错误；创作者应让提示词和工具策略保持一致。

几点额外建议：

- 前台 Profile 通常需要保留 `workspace.commit` 和 `workspace.finish`。
- 能委派任务的主 Agent 需要 `agent.list`、`agent.delegate`、`agent.await`。
- `task.return` 由 runtime 在子任务中提供，不应放进普通 Profile 的 `allow`。
- `dice.roll` 只在玩法明确需要随机性时开放。

## 相关页面

- 启动和订阅 run：阅读 [Agent API](/api/agent)。
- SubAgent 使用方式：阅读 [SubAgent](/agent/subagents)。
- Skill 管理接口：阅读 [Skill API](/api/skill)。
- 工作区概念：阅读 [Agent 系统架构](/architecture/agent)。
