---
description: TauriTavern Skill Host API 的导入、预览、安装、读取、导出和删除语义。
---

# Skill API

Skill API 用于管理本地 Agent SKILLS。它面向用户界面、扩展和导入流程；Agent run 内部读取 Skill 时使用的是 `skill.list`、`skill.search`、`skill.read` 工具，而不是直接调用 Host API。

[[toc]]

## 入口

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const skill = window.__TAURITAVERN__.api.skill;
```

公开入口以 `window.__TAURITAVERN__.api.skill` 为准。不要直接依赖底层 Tauri command 名称。

## 方法概览

```ts
type TauriTavernSkillApi = {
  list(): Promise<TauriTavernSkillIndexEntry[]>;
  listFiles(options: { name: string }): Promise<TauriTavernSkillFileRef[]>;
  pickImportArchive(): Promise<TauriTavernSkillImportInput | null>;
  previewImport(input: TauriTavernSkillImportInput): Promise<TauriTavernSkillImportPreview>;
  installImport(request: {
    input: TauriTavernSkillImportInput;
    conflictStrategy?: 'skip' | 'replace';
  }): Promise<TauriTavernSkillInstallResult>;
  readFile(options: {
    name: string;
    path: string;
    maxChars?: number;
    startLine?: number;
    lineCount?: number;
    startChar?: number;
  }): Promise<TauriTavernSkillReadResult>;
  export(options: { name: string }): Promise<TauriTavernSkillExportPayload>;
  exportSkill(options: { name: string }): Promise<TauriTavernSkillExportPayload>;
  delete(options: { name: string }): Promise<void>;
  deleteSkill(options: { name: string }): Promise<void>;
};
```

`export()` 与 `exportSkill()` 等价，`delete()` 与 `deleteSkill()` 等价。

## Skill 包结构

一个 Skill 是一个本地知识包。当前核心要求：

```text
my-skill/
  SKILL.md
  references/
  examples/
  assets/
  scripts/
  agents/tauritavern.json
```

规则：

- `SKILL.md` 必须存在。
- `SKILL.md` 必须以 YAML frontmatter 开头。
- frontmatter 必须包含 `name` 和 `description`。
- `name` 建议使用小写 ASCII、数字、`-`、`_`。
- `agents/tauritavern.json` 可选；存在但 schema 无效时会导入失败。
- `scripts/` 会被保留并在预览中提示风险，但当前不会执行。

Skill 不是可执行插件，不能授予工具权限，也不能自动安装 MCP server。

## list

列出已安装 Skill 的索引摘要。

```js
const skills = await skill.list();
```

返回项：

```ts
type TauriTavernSkillIndexEntry = {
  name: string;
  description: string;
  displayName?: string;
  sourceKind?: string;
  license?: string;
  author?: string;
  version?: string;
  tags: string[];
  installedHash: string;
  fileCount: number;
  totalBytes: number;
  hasScripts: boolean;
  hasBinary: boolean;
  installedAt: string;
  sourceRefs?: Array<{
    kind: string;
    id: string;
    label: string;
    installedHash: string;
  }>;
};
```

`list()` 不读取 Skill 文件内容，只返回索引信息。

## listFiles

列出某个 Skill 的文件树摘要。

```js
const files = await skill.listFiles({ name: 'gentle-romance-style' });
```

返回项：

```ts
type TauriTavernSkillFileRef = {
  path: string;
  kind: 'text' | 'binary';
  mediaType: string;
  sizeBytes: number;
  sha256: string;
};
```

这适合做文件浏览器或导入预览。文本内容需要用 `readFile()` 读取。

## pickImportArchive

唤起系统文件选择器，让用户选择 `.ttskill` 或兼容 zip。

```js
const input = await skill.pickImportArchive();
if (input) {
  const preview = await skill.previewImport(input);
}
```

用户取消时返回 `null`。选择成功时返回：

```ts
{ kind: 'archiveFile', path: string }
```

这个方法只负责选择文件，不负责安装。

## previewImport

预览一个待导入 Skill，进行解包、校验、hash 计算和冲突判断。

```js
const preview = await skill.previewImport(input);
```

导入输入支持三种：

```ts
type TauriTavernSkillImportInput =
  | {
      kind: 'inlineFiles';
      files: Array<{
        path: string;
        encoding?: 'utf8' | 'utf-8' | 'base64';
        content: string;
        mediaType?: string;
        sizeBytes?: number;
        sha256?: string;
      }>;
      source?: unknown;
    }
  | {
      kind: 'directory';
      path: string;
      source?: unknown;
    }
  | {
      kind: 'archiveFile';
      path: string;
      source?: unknown;
    };
```

返回：

```ts
type TauriTavernSkillImportPreview = {
  skill: TauriTavernSkillIndexEntry;
  files: TauriTavernSkillFileRef[];
  conflict: {
    kind: 'new' | 'same' | 'different';
    installedHash?: string;
  };
  warnings: string[];
  source: unknown;
};
```

冲突语义：

| `conflict.kind` | 含义 |
| --- | --- |
| `new` | 同名 Skill 不存在 |
| `same` | 同名且内容 hash 相同 |
| `different` | 同名但内容不同，需要用户决策 |

`warnings` 可能提示包含脚本、二进制文件或其它需要用户注意的内容。预览不等同安装。

## installImport

安装预览过的 Skill 输入。

```js
const result = await skill.installImport({
  input,
  conflictStrategy: 'replace',
});
```

请求：

```ts
type TauriTavernSkillInstallRequest = {
  input: TauriTavernSkillImportInput;
  conflictStrategy?: 'skip' | 'replace';
};
```

返回：

```ts
type TauriTavernSkillInstallResult = {
  name: string;
  action: 'installed' | 'replaced' | 'already_installed' | 'skipped';
  skill?: TauriTavernSkillIndexEntry;
};
```

不同 hash 的同名冲突不会自动改名。必须显式传入 `skip` 或 `replace`，否则会失败。

## readFile

读取已安装 Skill 内的 UTF-8 文本文件。

```js
const file = await skill.readFile({
  name: 'gentle-romance-style',
  path: 'SKILL.md',
  maxChars: 12000,
});
```

参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | Skill 名称 |
| `path` | string | 是 | Skill 内相对路径 |
| `maxChars` | integer | 否 | 最多返回字符数，默认 20000，后端最大 80000 |
| `startLine` | integer | 否 | 1-based 起始行 |
| `lineCount` | integer | 否 | 读取行数 |
| `startChar` | integer | 否 | 0-based 字符偏移 |

行范围和字符范围不能混用。

返回：

```ts
type TauriTavernSkillReadResult = {
  name: string;
  path: string;
  content: string;
  chars: number;
  totalChars: number;
  startChar: number;
  endChar: number;
  totalLines: number;
  startLine: number;
  endLine: number;
  bytes: number;
  sha256: string;
  truncated: boolean;
  resourceRef: string;
};
```

`readFile()` 只读取已安装 Skill 文件，不会修改 Skill，也不会把内容自动注入 Agent。Agent 运行中是否能读取某个 Skill，还要看当前 Agent Profile 的 `skills.visible` 和 `skills.deny`。

## export / exportSkill

导出已安装 Skill 为 `.ttskill` 归档。

```js
const payload = await skill.export({ name: 'gentle-romance-style' });
```

返回：

```ts
type TauriTavernSkillExportPayload = {
  fileName: string;
  contentBase64: string;
  sha256: string;
};
```

导出的 `.ttskill` 只包含 Skill 文件本身，不会写入会改变内容 hash 的诊断 sidecar。

## delete / deleteSkill

删除一个已安装 Skill。

```js
await skill.delete({ name: 'gentle-romance-style' });
```

这是用户显式管理动作，会删除本地索引记录和文件目录。它不会在 Agent run 中自动触发，也不会由模型调用。

## source 的用途

导入输入里的 `source` 用于记录来源引用。例如角色卡或预设嵌入 Skill 时，可以带上稳定来源 ID。这样在删除对应角色卡或预设时，TauriTavern 可以清理仅由该来源引用的 Skill。

`source` 不授予权限，也不改变 Skill 的信任级别。

## 安全与失败语义

以下情况会明确失败：

- `SKILL.md` 缺失。
- frontmatter 无效，或缺少 `name` / `description`。
- 路径越界、绝对路径、Windows 盘符、空字符。
- symlink 逃出 Skill 目录。
- zip entry 超限、压缩比异常或总大小超限。
- `agents/tauritavern.json` 存在但 schema 无效。
- 同名不同内容但没有用户冲突决策。
- Skill 索引损坏。

这些失败不会静默跳过，也不会自动改名安装。清楚失败可以避免用户以为安装成功，实际却运行在另一套资料上。

## 与 Agent 工具的关系

Host API 和 Agent 工具的职责不同：

| 层 | 能力 |
| --- | --- |
| `api.skill` | 用户或扩展管理本地 Skill：导入、安装、读取、导出、删除 |
| `skill.list` / `skill.search` / `skill.read` | Agent 在一次 run 中按 Profile 策略读取已安装 Skill |

模型不能通过 `api.skill` 安装、替换或删除 Skill。当前 Skill 安装只由用户界面或显式 Host API 调用触发。

## 相关页面

- Agent 内部如何读取 Skill：阅读 [Agent 工具参考](/api/agent-tools)。
- Skill 面向创作者的组织建议：阅读 [SKILLS](/agent/skills)。
- Agent Profile 如何限制 Skill 可见性：阅读 [Agent 配置档案](/agent/profiles)。
