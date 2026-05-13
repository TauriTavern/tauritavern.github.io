---
description: 面向 TauriTavern 主题与 CSS 美化作者的 Agent 前端适配指南。
---

# 主题美化作者指南

这页写给为 TauriTavern 制作主题、全局 CSS、角色卡附带美化或预设配套皮肤的作者。

Agent 系统增加了几块新的前端界面：发送栏里的 Agent 开关、运行时间线、Agent 系统面板、嵌入资产弹窗，以及 SKILLS 文件预览。这些界面默认会继承 SillyTavern / TauriTavern 原有主题变量；如果一套主题已经把主文字、边框、背景、引用色和模糊强度调整得比较协调，Agent 界面通常会自然贴合。

不过，Agent 界面也有一些新的状态和信息层级。主题作者如果希望进一步适配，可以从本页列出的变量和类名入手。

[[toc]]

## 先理解边界

Agent 前端样式的目标不是另起一套独立视觉系统，而是在原有主题之上补一层清晰的操作界面。

它主要遵循三条原则：

- 继续使用现有 `SmartTheme` 变量作为底色和文字来源。
- 使用 `ttas-` 前缀隔离 Agent 系统自己的样式。
- 通过 CSS 变量提供优先适配入口，尽量减少作者对深层 DOM 的依赖。

因此，主题作者可以把适配分成两层：

| 层级 | 推荐程度 | 说明 |
| --- | --- | --- |
| 覆盖 CSS 变量 | 推荐 | 最稳定，也最容易和后续界面调整共存 |
| 使用语义类名 | 可以 | 适合细调某个区域，如时间线条目、文件预览、工具列表 |
| 依赖深层结构 | 谨慎 | DOM 层级可能随功能演进变化，不适合作为长期主题基础 |

::: tip
如果只是想让 Agent 界面更贴合一套主题，优先覆盖 `.ttas-root` 和 `#ttas_agent_run_timeline` 上的变量。只有变量无法表达你的设计时，再考虑写更具体的选择器。
:::

## 继承的主题变量

Agent 样式会读取这些常见主题变量：

| 变量 | Agent 中的用途 |
| --- | --- |
| `--SmartThemeBodyColor` | 主文字、图标、细节文本混色 |
| `--SmartThemeBorderColor` | 面板边框、分隔线、按钮边界 |
| `--SmartThemeBlurTintColor` | 面板底色、浮层底色、玻璃感背景 |
| `--SmartThemeQuoteColor` | 默认强调色、运行中状态色、选中状态 |
| `--SmartThemeEmColor` | reasoning / 思考类详情的默认色彩来源 |
| `--SmartThemeBlurStrength` | 浮层、时间线和面板的背景模糊强度 |

这意味着很多主题不需要专门写 Agent CSS。只要这些基础变量协调，Agent 的默认样式就会跟随主题变化。

如果你正在制作一套完整主题，建议先检查这些基础变量，再考虑专门覆盖 `ttas-` 变量。这样能减少维护成本，也能让 Agent、扩展面板和原有 SillyTavern 界面保持一致。

## 通用变量

Agent 系统面板、嵌入资产弹窗、SKILLS 文件预览等区域，会以 `.ttas-root` 作为根作用域。适合从这里统一调整整体观感。

```css
.ttas-root {
  --ttas-accent: var(--SmartThemeQuoteColor);
  --ttas-border: color-mix(in srgb, var(--SmartThemeBorderColor) 82%, var(--SmartThemeBodyColor) 18%);
  --ttas-border-soft: color-mix(in srgb, var(--SmartThemeBorderColor) 72%, transparent);
  --ttas-surface: color-mix(in srgb, var(--SmartThemeBlurTintColor) 86%, transparent);
  --ttas-surface-soft: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, var(--black20a));
  --ttas-surface-strong: color-mix(in srgb, var(--SmartThemeBodyColor) 9%, var(--black30a));
  --ttas-surface-raised: color-mix(in srgb, var(--SmartThemeBlurTintColor) 78%, var(--SmartThemeBodyColor) 6%);
  --ttas-radius: 8px;
  --ttas-radius-sm: 6px;
  --ttas-shadow: 0 20px 64px color-mix(in srgb, var(--black70a) 82%, transparent);
}
```

常用调整方向：

| 变量 | 适合调整什么 |
| --- | --- |
| `--ttas-accent` | Agent 面板、按钮、图标和时间线的主强调色 |
| `--ttas-border` | 主要边框的清晰度 |
| `--ttas-border-soft` | 次级分隔线、卡片边界 |
| `--ttas-surface` | 大面板底色 |
| `--ttas-surface-soft` | 轻量块、代码块、输入区域底色 |
| `--ttas-surface-strong` | hover、选中、较强层级背景 |
| `--ttas-surface-raised` | 面板内分区的抬升感 |
| `--ttas-radius` | 主要圆角 |
| `--ttas-radius-sm` | 小按钮、小列表项和输入框圆角 |
| `--ttas-shadow` | Agent 弹窗阴影 |

示例：让 Agent 面板更平、更少玻璃感。

```css
.ttas-root {
  --ttas-surface: color-mix(in srgb, var(--SmartThemeBlurTintColor) 96%, transparent);
  --ttas-surface-raised: color-mix(in srgb, var(--SmartThemeBlurTintColor) 92%, var(--SmartThemeBodyColor) 3%);
  --ttas-shadow: 0 12px 32px rgb(0 0 0 / 0.28);
}
```

## 发送栏 Agent 开关

发送栏中的 Agent 开关使用：

```text
.ttas-agent-send-toggle
.ttas-agent-send-toggle-icon
.ttas-agent-send-toggle-status
```

常见状态：

| 选择器 | 含义 |
| --- | --- |
| `.ttas-agent-send-toggle` | Agent 开关基础状态 |
| `.ttas-agent-send-toggle.active` | Agent Mode 已开启 |
| `.ttas-agent-send-toggle.running` | 当前有 Agent run 正在运行 |
| `.ttas-agent-send-toggle-status` | 右下角状态点 |

它会使用 `--ttas-agent-state-color` 表示当前状态色。默认关闭时较淡，开启后接近 `--ttas-accent`。

示例：让开启状态更醒目，但不改变按钮尺寸。

```css
.ttas-agent-send-toggle.active {
  --ttas-agent-state-color: #68d8b4;
}

.ttas-agent-send-toggle.active::before {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.12),
    0 0 16px color-mix(in srgb, var(--ttas-agent-state-color) 42%, transparent);
}
```

不建议直接修改它的 `width`、`height`、`order` 或 `display`。这些属性和发送栏布局、生成状态隐藏逻辑有关。若只是想改变视觉强度，优先改颜色、边框、阴影和透明度。

## 运行时间线

运行时间线是 Agent 最重要的新增界面。它挂载在发送框上方，根节点为：

```text
#ttas_agent_run_timeline
```

外层挂载点为：

```text
.ttas-run-timeline-mount
```

时间线会根据运行状态切换类名和数据属性：

| 选择器 | 含义 |
| --- | --- |
| `#ttas_agent_run_timeline.is-collapsed` | 时间线折叠 |
| `#ttas_agent_run_timeline.is-running` | 当前 run 正在运行 |
| `#ttas_agent_run_timeline.is-details-open` | 详情页已打开 |
| `#ttas_agent_run_timeline.is-error` | 当前 run 失败 |
| `#ttas_agent_run_timeline[data-ttas-status="idle"]` | 尚无当前 run |
| `#ttas_agent_run_timeline[data-ttas-status="ready"]` | 有可查看 run，但不在运行 |
| `#ttas_agent_run_timeline[data-ttas-status="running"]` | 正在运行 |
| `#ttas_agent_run_timeline[data-ttas-status="completed"]` | 已完成 |
| `#ttas_agent_run_timeline[data-ttas-status="failed"]` | 已失败 |
| `#ttas_agent_run_timeline[data-ttas-status="cancelled"]` | 已取消 |
| `#ttas_agent_run_timeline[data-ttas-view="collapsed"]` | 折叠视图 |
| `#ttas_agent_run_timeline[data-ttas-view="events"]` | 事件列表视图 |
| `#ttas_agent_run_timeline[data-ttas-view="details"]` | 详情视图 |

### 时间线变量

时间线使用独立的一组变量，避免运行状态颜色影响整个 Agent 面板。

| 变量 | 用途 |
| --- | --- |
| `--ttas-run-panel-bg` | 时间线面板背景 |
| `--ttas-run-panel-bg-strong` | 时间线标题、详情粘性栏背景 |
| `--ttas-run-panel-border` | 时间线主边框 |
| `--ttas-run-panel-border-soft` | 时间线内部分隔线 |
| `--ttas-run-panel-accent` | 时间线强调色 |
| `--ttas-run-line-bg` | 普通事件行背景 |
| `--ttas-run-line-bg-active` | 最新事件行背景 |
| `--ttas-run-line-text-muted` | 次级文本 |
| `--ttas-run-tone-read` | 读取、搜索、列表类事件 |
| `--ttas-run-tone-write` | 写入、修改类事件 |
| `--ttas-run-tone-commit` | 提交、持久保存类事件 |
| `--ttas-run-tone-success` | 成功状态 |
| `--ttas-run-tone-warn` | 警告状态 |
| `--ttas-run-tone-error` | 错误状态 |

示例：给时间线一套更低调的深色主题。

```css
#ttas_agent_run_timeline {
  --ttas-run-panel-bg: rgb(20 22 26 / 0.82);
  --ttas-run-panel-bg-strong: rgb(24 27 32 / 0.94);
  --ttas-run-panel-border: rgb(180 190 210 / 0.18);
  --ttas-run-panel-border-soft: rgb(180 190 210 / 0.12);
  --ttas-run-panel-accent: #9fc7ff;
  --ttas-run-line-bg: rgb(255 255 255 / 0.045);
  --ttas-run-line-bg-active: rgb(159 199 255 / 0.12);
}
```

### 时间线条目

事件列表中的每一项使用：

```text
.ttas-run-event
.ttas-run-event-icon
.ttas-run-event-copy
.ttas-run-event-title
.ttas-run-event-meta
```

事件会带有类型类名和语义属性：

| 选择器 | 含义 |
| --- | --- |
| `.ttas-run-event.kind-read` | 读取文件、聊天、SKILLS 等 |
| `.ttas-run-event.kind-search` | 搜索聊天或文件 |
| `.ttas-run-event.kind-list` | 列出资源 |
| `.ttas-run-event.kind-write` | 写入文件 |
| `.ttas-run-event.kind-patch` | 应用 patch |
| `.ttas-run-event.kind-commit` | 提交到聊天 |
| `.ttas-run-event.kind-persist` | 持久工作区保存 |
| `.ttas-run-event.tone-info` | 普通信息 |
| `.ttas-run-event.tone-active` | 当前活跃步骤 |
| `.ttas-run-event.tone-success` | 成功 |
| `.ttas-run-event.tone-warn` | 警告 |
| `.ttas-run-event.tone-error` | 错误 |
| `.ttas-run-event.is-latest` | 当前列表中的最新条目 |
| `.ttas-run-event.is-active` | 最新且仍在进行中的条目 |
| `.ttas-run-event.is-selected` | 详情视图当前选中的条目 |
| `.ttas-run-event[data-ttas-kind="read"]` | 事件 kind 数据属性，适合更精确适配 |

示例：区分读取、写入和提交事件。

```css
#ttas_agent_run_timeline {
  --ttas-run-tone-read: #8eb6ff;
  --ttas-run-tone-write: #82d497;
  --ttas-run-tone-commit: #dcc56f;
}

.ttas-run-event.kind-commit button {
  border-color: color-mix(in srgb, var(--ttas-run-tone-commit) 38%, transparent);
}
```

## 详情、reasoning 和 diff

时间线详情页会展示部分事件的详细内容，例如读到的文件、写入结果、模型响应摘要、错误信息和 diff。

主要类名：

```text
.ttas-run-detail-head
.ttas-run-detail-nav
.ttas-run-detail-scroll
.ttas-run-detail-section
.ttas-run-detail-block
.ttas-run-detail-block-head
.ttas-run-diff
.ttas-run-diff-row
.ttas-run-diff-gutter
.ttas-run-diff-marker
.ttas-run-diff-code
```

详情块会带有数据属性：

| 选择器 | 含义 |
| --- | --- |
| `.ttas-run-detail-block[data-ttas-block-kind="text"]` | 普通文本 |
| `.ttas-run-detail-block[data-ttas-block-kind="json"]` | JSON 或结构化内容 |
| `.ttas-run-detail-block[data-ttas-block-kind="reasoning"]` | reasoning / 思考类内容 |
| `.ttas-run-detail-block[data-ttas-block-kind="diff"]` | diff 内容 |
| `.ttas-run-diff-row[data-ttas-diff-row="add"]` | 新增行 |
| `.ttas-run-diff-row[data-ttas-diff-row="delete"]` | 删除行 |
| `.ttas-run-diff-row[data-ttas-diff-row="context"]` | 上下文行 |

常用变量：

| 变量 | 用途 |
| --- | --- |
| `--ttas-run-reasoning-color` | reasoning 文本与边框色 |
| `--ttas-run-reasoning-bg` | reasoning 背景 |
| `--ttas-run-reasoning-border` | reasoning 左侧边框 |
| `--ttas-run-detail-block-bg` | 详情块关闭或普通背景 |
| `--ttas-run-detail-block-bg-open` | 详情块展开背景 |
| `--ttas-run-diff-add-color` | diff 新增行文字 |
| `--ttas-run-diff-add-bg` | diff 新增行背景 |
| `--ttas-run-diff-delete-color` | diff 删除行文字 |
| `--ttas-run-diff-delete-bg` | diff 删除行背景 |
| `--ttas-run-diff-context-bg` | diff 上下文行背景 |
| `--ttas-run-diff-gutter-color` | diff 行号颜色 |

示例：提高 diff 在深色主题下的可读性。

```css
#ttas_agent_run_timeline {
  --ttas-run-diff-add-color: #8ee6a1;
  --ttas-run-diff-add-bg: rgb(70 190 105 / 0.18);
  --ttas-run-diff-delete-color: #ff9b93;
  --ttas-run-diff-delete-bg: rgb(230 88 82 / 0.16);
  --ttas-run-diff-context-bg: rgb(255 255 255 / 0.035);
  --ttas-run-diff-gutter-color: rgb(220 225 235 / 0.42);
}
```

## Agent 系统面板

Agent 系统面板用于管理配置档案和 SKILLS。它的根节点是：

```text
.ttas-panel-root
```

常见区域：

| 类名 | 区域 |
| --- | --- |
| `.ttas-titlebar` | 面板标题栏 |
| `.ttas-panel-body` | 面板主体 |
| `.ttas-tabs` | Profiles / SKILLS 标签 |
| `.ttas-profile-layout` | 配置档案编辑布局 |
| `.ttas-list` | 左侧列表 |
| `.ttas-side-list` | 桌面端侧栏列表 |
| `.ttas-mobile-select` | 移动端选择器 |
| `.ttas-editor-hero` | 配置档案摘要区 |
| `.ttas-stat-grid` | 配置统计卡片区 |
| `.ttas-section` | 普通分区 |
| `.ttas-form-grid` | 表单栅格 |
| `.ttas-field` | 单个表单字段 |
| `.ttas-json` | JSON 文本区或预览块 |
| `.ttas-toolbar` | 操作按钮区 |

配置档案里的工具矩阵有一组更细的类名：

| 类名 | 区域 |
| --- | --- |
| `.ttas-tool-workbench` | 工具工作区整体布局 |
| `.ttas-tool-groups` | 工具分组容器 |
| `.ttas-tool-group` | 单个工具分组 |
| `.ttas-tool-row` | 单个工具行 |
| `.ttas-tool-row.enabled` | 工具已启用 |
| `.ttas-tool-row.active` | 当前选中的工具 |
| `.ttas-tool-row.customized` | 工具说明已被自定义 |
| `.ttas-tool-editor-panel` | 工具说明编辑面板 |
| `.ttas-tool-badge-custom` | 自定义说明标记 |
| `.ttas-tool-badge-write` | 写入类工具标记 |
| `.ttas-tool-badge-disabled` | 禁用工具标记 |

示例：让已启用的工具更清楚。

```css
.ttas-tool-row.enabled {
  border-color: color-mix(in srgb, var(--ttas-accent) 48%, var(--ttas-border));
  background-color: color-mix(in srgb, var(--ttas-accent) 14%, var(--SmartThemeBlurTintColor));
}

.ttas-tool-row.enabled .ttas-tool-select strong {
  color: color-mix(in srgb, var(--ttas-accent) 72%, var(--SmartThemeBodyColor));
}
```

## SKILLS 与文件预览

SKILLS 管理页和文件预览主要使用这些类名：

| 类名 | 区域 |
| --- | --- |
| `.ttas-skill-pane` | Skill 详情面板 |
| `.ttas-skill-hero` | 当前 Skill 摘要 |
| `.ttas-skill-meta` | Skill 名称、描述和标签 |
| `.ttas-tags` | 标签列表 |
| `.ttas-files-section` | Skill 文件区域 |
| `.ttas-file-viewport` | 文件树滚动区域 |
| `.ttas-file-tree` | 文件树 |
| `.ttas-file-tree-root` | 文件树根节点 |
| `.ttas-file-row` | 文件或文件夹行 |
| `.ttas-file-dialog` | 文件预览弹窗 |
| `.ttas-file-viewer` | 文件预览主体 |
| `.ttas-file-content` | 文件文本内容 |

Skill 文件内容通常是长文本，建议保持足够的行高、对比度和可滚动性。可以调整字体，但不建议把 `.ttas-file-content` 改成不可滚动或固定高度过小。

示例：让文件预览更接近代码阅读器。

```css
.ttas-file-content {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88rem;
  line-height: 1.6;
  background-color: color-mix(in srgb, var(--SmartThemeBlurTintColor) 88%, black 8%);
}
```

## 嵌入资产弹窗

预设或角色卡可以嵌入 Agent Profile 和 SKILLS。相关弹窗使用：

| 类名 | 区域 |
| --- | --- |
| `.ttas-embed-dialog` | 嵌入资产弹窗外层 |
| `.ttas-embed-panel` | 弹窗主体 |
| `.ttas-embed-titlebar` | 标题栏 |
| `.ttas-embed-body` | 弹窗内容 |
| `.ttas-embed-target` | 当前目标信息 |
| `.ttas-embed-card` | 单个操作区块 |
| `.ttas-embed-action-row` | 选择器和按钮行 |
| `.ttas-embedded-list` | 已嵌入项目列表 |
| `.ttas-embedded-item` | 单个已嵌入项目 |

这类弹窗常在预设、角色卡管理流程里出现。它需要和原有管理界面保持一致，通常不需要过度强调 Agent 品牌感。

## 移动端注意事项

TauriTavern 在移动端会处理安全区、键盘抬升和浮层几何。Agent 面板也会读取这些宿主变量：

```text
--tt-inset-top
--tt-inset-right
--tt-inset-bottom
--tt-inset-left
--tt-viewport-bottom-inset
--tt-base-viewport-height
```

主题作者一般不需要直接覆盖它们。它们属于宿主布局契约，用来避免顶部安全区、底部手势条和软键盘遮挡界面。

::: warning
不建议在主题中强行覆盖 Agent 弹窗、时间线和主界面的核心几何属性，例如 `position`、`inset`、`top`、`bottom`、`height`、`max-height`、`pointer-events`。这些属性常常和移动端安全区、输入框位置、折叠状态或详情视图有关。
:::

如果需要做移动端适配，建议使用媒体查询收窄视觉细节，而不是重写几何系统：

```css
@media (max-width: 600px) {
  #ttas_agent_run_timeline {
    --ttas-run-panel-accent: #8bd7ff;
    --ttas-run-line-text-muted: color-mix(in srgb, var(--SmartThemeBodyColor) 58%, transparent);
  }

  .ttas-run-event-title {
    font-size: 0.8rem;
  }
}
```

## 动画和可访问性

Agent 界面有一些轻量动画：发送栏开关的运行状态、时间线活跃点、详情展开等。默认样式已经包含 `prefers-reduced-motion: reduce` 处理。

主题作者可以调整动画强度，但建议保留降级逻辑：

```css
@media (prefers-reduced-motion: reduce) {
  .ttas-agent-send-toggle,
  #ttas_agent_run_timeline,
  .ttas-root * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

也建议保留清楚的焦点样式。Agent 面板里有不少按钮、列表项和详情折叠块，键盘用户需要看见当前焦点在哪里。

## 不建议这样做

这些写法短期可能看起来有效，但比较容易带来维护问题：

- 不建议用过宽的全局选择器覆盖所有 `.menu_button`，然后让 Agent 面板按钮失去尺寸和状态区分。
- 不建议把 `.ttas-agent-send-toggle` 或 `#ttas_agent_run_timeline` 直接 `display: none`，除非你的主题明确声明不展示 Agent 入口或时间线。
- 不建议依赖 `.ttas-panel-root > div > section > div` 这类深层结构选择器。
- 不建议把时间线固定成很大的高度；它需要和聊天输入区、移动端键盘以及详情视图共同工作。
- 不建议移除 `.ttas-run-resize-handle` 的可点击区域，否则用户无法调整时间线高度。
- 不建议让 diff 的新增和删除行只靠颜色区分到完全不可读；最好同时保留足够的明暗差。
- 不建议把文本区、文件预览或详情块设成 `overflow: hidden`，长内容会被截断。

## 发布前检查

发布包含 Agent 适配的主题前，建议至少检查这些状态：

| 检查项 | 需要确认 |
| --- | --- |
| Agent Mode 关闭 | 普通发送栏布局没有被影响 |
| Agent Mode 开启 | 发送栏 Agent 开关可见，active 状态清楚 |
| 运行中 | 时间线折叠状态、运行动画和最新事件可读 |
| 已完成 | completed 状态不被误认为仍在运行 |
| 失败状态 | failed / error 色彩醒目但不刺眼 |
| 详情页 | 文本块、JSON、reasoning、diff 都能滚动阅读 |
| Profile 面板 | 表单、工具矩阵、JSON 区没有溢出 |
| SKILLS 面板 | 文件树和文件预览在长文件名下仍可用 |
| 浅色主题 | 边框、背景和次级文字有足够对比 |
| 深色主题 | diff、错误、警告、提交状态没有糊成一片 |
| 小屏幕 | 时间线不遮挡输入框，弹窗没有超出视口 |

Agent 的界面会随着功能继续增长。一个稳妥的主题适配方式，是先通过变量建立整体气质，再对少数关键区域做轻量选择器补充。这样既能保留主题的个性，也能给未来的 Agent 面板留出自然演进的空间。
