---
description: 理解 TauriTavern Agent SKILLS 的用途、结构、导入导出与安全边界。
---

# SKILLS

SKILLS 是 Agent 可以按需读取的本地知识包。

它适合保存写作方法、角色创作建议、格式要求、世界观参考、风格示例和任务说明。与把大段文本直接塞进提示词相比，SKILLS 更适合长期维护，也更方便让 Agent 在需要时读取具体文件。

## SKILLS 不是什么

为了保持边界清楚，当前 SKILLS 有几条重要限制：

- SKILLS 不是可执行插件。
- SKILLS 不会自动注入完整提示词。
- SKILLS 不能授予工具权限。
- SKILLS 不能自动安装 MCP server。
- Agent 不能在运行中安装、替换或修改已安装 SKILLS。

如果 Skill 包含 `scripts/`，TauriTavern 会保留并提示风险，但当前不会执行其中脚本。

## 适合放进 SKILLS 的内容

适合：

- 某类文体的写作步骤。
- 角色语气、关系推进、禁忌事项。
- 状态栏或小剧场格式要求。
- 复杂世界观的分章节资料。
- 可复用的检查清单。
- 少量优秀示例。

不太适合：

- 每次都会变化的当前聊天状态。
- 大段完整聊天历史。
- 密钥、账号、私人路径。
- 希望模型无条件逐字遵守的核心提示词。
- 需要执行代码才能生效的逻辑。

## 基本结构

一个 Skill 是一个目录，核心文件是 `SKILL.md`：

```text
my-skill/
  SKILL.md
  references/
  examples/
  assets/
  scripts/
  agents/tauritavern.json
```

当前要求：

- `SKILL.md` 必须存在。
- `SKILL.md` 需要以 YAML frontmatter 开头。
- frontmatter 必须包含 `name` 和 `description`。
- `name` 建议使用小写字母、数字、`-` 或 `_`。
- `agents/tauritavern.json` 可选；如果存在但格式无效，导入会失败。

一个很小的例子：

```md
---
name: gentle-romance-style
description: 为细腻、慢热、重视心理变化的情感写作提供参考。
---

# Gentle Romance Style

这份 Skill 用于帮助 Agent 处理慢热关系推进。

## 使用时机

- 角色关系需要自然升温。
- 当前回复需要更多心理层次。
- 用户希望减少突兀的情节跳跃。

## 写作倾向

- 优先写动作和细节，不急着总结感情。
- 让角色通过选择、停顿和回避表达变化。
- 避免用解释性独白替代互动。
```

## 导入与安装

Agent 系统面板中的 `SKILLS` 页可以导入 Skill 归档。

常见流程是：

1. 选择 `.ttskill` 或兼容的 zip 归档。
2. 预览 Skill 信息、文件数量、大小和警告。
3. 如果没有冲突，直接安装。
4. 如果同名但内容不同，选择跳过或替换。

同名且内容相同的 Skill 会被识别为已安装。不同内容的同名 Skill 不会自动改名，必须由用户明确决定。

## 查看、导出与删除

安装后，可以在 `SKILLS` 页查看文件树。

- 文本文件可以直接打开预览。
- 二进制文件会显示为文件，但不会作为普通文本展示。
- 可以导出为 `.ttskill`，用于分享或备份。
- 用户显式删除 Skill 时，会删除本地安装记录和文件目录。

## Agent 如何读取 SKILLS

Agent 并不会默认读完整 Skill。它通常会：

1. 使用 `skill.list` 查看当前配置档案允许的 SKILLS。
2. 使用 `skill.search` 在某个 Skill 中搜索相关片段。
3. 使用 `skill.read` 读取 `SKILL.md` 或某个文件范围。

读取受到配置档案限制：

- 不可见的 Skill 不会出现在列表中。
- 被禁用的 Skill 即使存在也不能读取。
- 单次读取和整次运行都有字符预算。
- 只能读取 UTF-8 文本文件。

这种按需读取能让 Skill 保持可维护，同时避免把所有资料一次性塞入上下文。

## 给创作者的组织建议

一个好用的 Skill 往往不需要很厚。它应该让 Agent 很快知道三件事：

- 什么时候使用它。
- 先读哪些文件。
- 使用时要注意哪些边界。

建议：

- 在 `SKILL.md` 开头写清楚适用场景。
- 把长参考拆到 `references/`。
- 把少量示例放到 `examples/`。
- 文件名保持清楚，例如 `status-bar-format.md`、`relationship-pacing.md`。
- 不要把多个互不相关的玩法塞进一个 Skill。

如果一个 Skill 需要和某个 Agent 配置档案配合使用，请在说明中写明推荐配置，而不是假设用户一定启用了所有工具。

