---
description: Import, preview, install, read, export, and delete semantics for the TauriTavern Skill Host API.
---

# Skill API

The Skill API manages local Agent SKILLS. It is for user interfaces, extensions, and import flows. When an Agent run reads Skill content, it uses the `skill.list`, `skill.search`, and `skill.read` tools instead of calling the Host API directly.

[[toc]]

## Entry Point

```js
await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);

const skill = window.__TAURITAVERN__.api.skill;
```

The public entry point is `window.__TAURITAVERN__.api.skill`. Do not depend on underlying Tauri command names.

## Methods

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

`export()` and `exportSkill()` are equivalent. `delete()` and `deleteSkill()` are equivalent.

## Skill Package Structure

A Skill is a local knowledge package. Current core requirements:

```text
my-skill/
  SKILL.md
  references/
  examples/
  assets/
  scripts/
  agents/tauritavern.json
```

Rules:

- `SKILL.md` must exist.
- `SKILL.md` must start with YAML frontmatter.
- The frontmatter must include `name` and `description`.
- `name` should use lowercase ASCII, digits, `-`, or `_`.
- `agents/tauritavern.json` is optional. If present but invalid, import fails.
- `scripts/` is preserved and shown as a warning during preview, but scripts are not executed today.

A Skill is not an executable plugin. It cannot grant tool permissions or install an MCP server automatically.

## list

Lists summaries for installed Skills.

```js
const skills = await skill.list();
```

Return item:

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

`list()` does not read Skill file contents. It only returns index information.

## listFiles

Lists the file tree summary for one Skill.

```js
const files = await skill.listFiles({ name: 'gentle-romance-style' });
```

Return item:

```ts
type TauriTavernSkillFileRef = {
  path: string;
  kind: 'text' | 'binary';
  mediaType: string;
  sizeBytes: number;
  sha256: string;
};
```

This is useful for file browsers and import previews. Use `readFile()` to read text content.

## pickImportArchive

Opens the system file picker so the user can choose a `.ttskill` or compatible zip archive.

```js
const input = await skill.pickImportArchive();
if (input) {
  const preview = await skill.previewImport(input);
}
```

Returns `null` when the user cancels. On success it returns:

```ts
{ kind: 'archiveFile', path: string }
```

This method only chooses a file. It does not install it.

## previewImport

Previews a Skill import by unpacking, validating, hashing, and checking conflicts.

```js
const preview = await skill.previewImport(input);
```

Import input supports three forms:

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

Return value:

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

Conflict semantics:

| `conflict.kind` | Meaning |
| --- | --- |
| `new` | No installed Skill with this name exists |
| `same` | Same name and same content hash |
| `different` | Same name but different content; user decision is required |

`warnings` may mention scripts, binary files, or other content the user should notice. Preview is not installation.

## installImport

Installs a Skill import input.

```js
const result = await skill.installImport({
  input,
  conflictStrategy: 'replace',
});
```

Request:

```ts
type TauriTavernSkillInstallRequest = {
  input: TauriTavernSkillImportInput;
  conflictStrategy?: 'skip' | 'replace';
};
```

Return value:

```ts
type TauriTavernSkillInstallResult = {
  name: string;
  action: 'installed' | 'replaced' | 'already_installed' | 'skipped';
  skill?: TauriTavernSkillIndexEntry;
};
```

A same-name, different-hash conflict is not automatically renamed. The caller must explicitly pass `skip` or `replace`, otherwise installation fails.

## readFile

Reads a UTF-8 text file from an installed Skill.

```js
const file = await skill.readFile({
  name: 'gentle-romance-style',
  path: 'SKILL.md',
  maxChars: 12000,
});
```

Parameters:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Skill name |
| `path` | string | Yes | Relative path inside the Skill |
| `maxChars` | integer | No | Maximum characters, default 20000, backend maximum 80000 |
| `startLine` | integer | No | 1-based starting line |
| `lineCount` | integer | No | Number of lines to read |
| `startChar` | integer | No | 0-based character offset |

Line ranges and character ranges cannot be mixed.

Return value:

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

`readFile()` only reads installed Skill files. It does not modify a Skill, and it does not automatically inject content into an Agent run. Whether an Agent can read a Skill during a run still depends on the current Agent Profile's `skills.visible` and `skills.deny`.

## export / exportSkill

Exports an installed Skill as a `.ttskill` archive.

```js
const payload = await skill.export({ name: 'gentle-romance-style' });
```

Return value:

```ts
type TauriTavernSkillExportPayload = {
  fileName: string;
  contentBase64: string;
  sha256: string;
};
```

The exported `.ttskill` contains only the Skill files themselves. It does not include diagnostic sidecar files that would change the content hash.

## delete / deleteSkill

Deletes an installed Skill.

```js
await skill.delete({ name: 'gentle-romance-style' });
```

This is an explicit user management action. It removes the local index record and file directory. It is not triggered automatically during an Agent run, and the model cannot call it.

## Purpose of source

The `source` field on import input records where the Skill came from. For example, a character card or preset with an embedded Skill can pass a stable source ID. Later, when that character card or preset is removed, TauriTavern can clean up Skills that are only referenced by that source.

`source` does not grant permissions and does not change the trust level of a Skill.

## Safety and Failure Semantics

These cases fail clearly:

- Missing `SKILL.md`.
- Invalid frontmatter, or missing `name` / `description`.
- Path traversal, absolute path, Windows drive prefix, or NUL character.
- Symlink escape from the Skill directory.
- Zip entry limit, suspicious compression ratio, or total size limit.
- Present but invalid `agents/tauritavern.json`.
- Same-name, different-content conflict without a user decision.
- Damaged Skill index.

These failures are not silently skipped, and imports are not automatically renamed. Clear failure keeps users from believing a Skill was installed when the runtime is actually using a different set of material.

## Relationship to Agent Tools

The Host API and Agent tools have different responsibilities:

| Layer | Ability |
| --- | --- |
| `api.skill` | User or extension management for local Skills: import, install, read, export, delete |
| `skill.list` / `skill.search` / `skill.read` | Agent reads installed Skills during one run according to Profile policy |

The model cannot use `api.skill` to install, replace, or delete Skills. Skill installation is currently triggered only by user UI or explicit Host API calls.

## Related Pages

- How Agent reads Skill content internally: [Agent Tool Reference](/en/api/agent-tools).
- How creators can organize Skill packages: [SKILLS](/en/agent/skills).
- How Agent Profiles limit Skill visibility: [Agent Profiles](/en/agent/profiles).
