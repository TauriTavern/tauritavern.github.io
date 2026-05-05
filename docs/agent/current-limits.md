---
description: 记录当前 TauriTavern Agent 的已开放能力、限制和后续规划边界。
---

# 当前能力与边界

本页用于说明当前 Agent 最小可用阶段已经开放什么、尚未开放什么，以及使用时应注意哪些兼容边界。

它不是长期承诺清单。随着 TauriTavern 更新，具体能力会继续调整；如果其它页面和本页冲突，请优先以本页的“当前边界”作为用户文档口径。

## 已开放能力

当前已经可以使用：

- Agent Mode 开关。
- 普通发送、重新生成、右划生成新候选接入 Agent。
- Agent 运行时间线。
- 配置档案列表、读取、保存、删除、导出。
- 内置 `default-writer` 配置。
- SKILLS 导入、预览、安装、读取、导出、删除。
- Agent 读取当前聊天历史。
- Agent 读取本轮激活的世界书条目。
- Agent 按配置档案读取 SKILLS。
- Agent 在工作区中读取、搜索、写入和修改文件。
- Agent 将 `output/main.md` 提交为聊天消息。
- Agent 可通过 append 模式多次提交，让同一次运行形成短对话式回复节奏。

## 当前内建工具

| 类别 | 工具 | 状态 |
| --- | --- | --- |
| 上下文 | `chat.search` | 已开放 |
| 上下文 | `chat.read_messages` | 已开放 |
| 上下文 | `worldinfo.read_activated` | 已开放 |
| SKILLS | `skill.list` | 已开放 |
| SKILLS | `skill.search` | 已开放 |
| SKILLS | `skill.read` | 已开放 |
| 工作区 | `workspace.list_files` | 已开放 |
| 工作区 | `workspace.search_files` | 已开放 |
| 工作区 | `workspace.read_file` | 已开放 |
| 工作区 | `workspace.write_file` | 已开放 |
| 工作区 | `workspace.apply_patch` | 已开放 |
| 控制 | `workspace.commit` | 已开放 |
| 控制 | `workspace.finish` | 已开放 |

`workspace.commit` 支持替换式提交和追加式提交。追加式提交适合短对话、分段回应和更轻的聊天节奏。

## 当前生成边界

当前 Agent 仍通过兼容桥捕获本轮普通生成上下文。也就是说，它会先借用原有 SillyTavern 生成流程整理 prompt、世界书等信息，再交给 Rust Agent runtime 执行工具循环。

需要注意：

- 当前要求使用 chat-completion 路径。
- 当前不支持 Agent 流式输出。
- 当前不接受已有外部 tools、`tool_choice` 或 tool turns 的 prompt snapshot。
- Agent 工具由 TauriTavern runtime 注册，不能混用旧的 Legacy ToolManager 工具结果楼层。
- Agent Mode 关闭时，普通 SillyTavern 生成语义保持不变。

## 当前配置档案边界

配置档案当前可以控制：

- 可见工具。
- SKILLS 可见性和读取预算。
- 工作区可见和可写根目录。
- 输出正文路径。
- 最大工具轮数和调用数。
- 前台或后台呈现方式。
- 模型瞬时错误重试策略。
- Agent 系统提示词。

当前尚未开放：

- Profile 根据阶段自动切换模型。
- Preset 自动接管模型或 provider。
- 完整 Plan Mode runtime。
- 多个 Profile 的自动路由。
- 按计划节点限制工具和输出。

配置里如果出现尚未支持的模式，TauriTavern 倾向于明确失败，而不是默默按默认值继续。

## 当前 SKILLS 边界

SKILLS 当前用于本地知识管理和 Agent 按需读取。

当前支持：

- 从本地归档导入。
- 预览导入内容。
- 同名冲突时选择跳过或替换。
- 查看已安装 Skill 文件树。
- 读取 UTF-8 文本文件。
- 导出 `.ttskill`。

当前不支持：

- 执行 Skill 中的脚本。
- Skill 自动授予工具权限。
- Skill 自动安装 MCP server。
- Agent 在运行中安装或替换 Skill。
- Skill marketplace、自动更新、多版本依赖解析。

## 尚未开放的 Agent 能力

这些能力在设计上有位置，但当前不应在用户文档中当成可用功能来依赖：

| 能力 | 当前状态 |
| --- | --- |
| `readDiff` | 已预留 API 名称，当前未实现 |
| `rollback` | 已预留 API 名称，当前未实现 |
| `listRuns` | 已预留 API 名称，当前未实现 |
| `approveToolCall` | 已预留 API 名称，当前未实现 |
| resume-run | 尚未作为用户能力开放 |
| MCP 工具 | 尚未接入 Agent 工具集 |
| shell 工具 | 当前不作为默认能力 |
| extension tool bridge | 尚未作为稳定用户能力开放 |
| Agent streaming timeline chunks | 当前 provider stream chunk 不是 Agent 事件 |

当前 append 提交不会创建多条完全独立的聊天楼层；它是同一次 Agent 运行对当前 Agent 消息的连续补充。

## 兼容性原则

TauriTavern Agent 的当前原则是：

- Agent Mode off 时，不改变 Legacy Generate。
- Agent 工具结果不写入聊天楼层。
- Agent 时间线不伪装成 SillyTavern 的 `GENERATION_*` 或 `TOOL_CALLS_*` 事件。
- 聊天提交仍走现有保存路径。
- 工作区路径必须是相对路径，不能逃出工作区。
- 用户显式拒绝的工具和平台禁用能力不能被配置档案覆盖。

这些限制看起来保守，但能保护上游兼容、移动端性能和长期维护空间。

## 遇到失败时先看哪里

如果一次 Agent 运行失败，可以按这个顺序检查：

1. 当前是否使用支持的 chat-completion 路径。
2. 配置档案是否保留了 `workspace.commit` 和 `workspace.finish`。
3. 系统提示词是否要求使用被禁用的工具。
4. SKILLS 名称是否写错，或被配置档案禁用。
5. 输出路径是否仍在可见、可写工作区中。
6. 时间线中最后一个失败事件是什么。

如果 Agent 直接失败而没有普通生成结果，这是当前设计的一部分。明确失败比静默降级更容易让用户和创作者定位问题。
