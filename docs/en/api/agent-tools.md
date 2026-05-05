---
description: Names, purposes, input parameters, result semantics, and limitations for the current built-in TauriTavern Agent tools.
---

# Agent Tool Reference

Agent tools are how the model acts inside a constrained workspace. They can read chat, inspect this turn's activated World Info, read SKILLS on demand, operate on workspace files, and commit output when the work is ready.

Tool calls are Agent run events. They are not written as chat message layers. The chat keeps only the committed result.

[[toc]]

## Names and Visibility

Each tool has two names:

| Name | Example | Purpose |
| --- | --- | --- |
| Canonical name | `workspace.apply_patch` | Used in Profiles, timeline, and documentation |
| Model-facing alias | `workspace_apply_patch` | Function name exposed to the model and provider |

Agent Profiles use canonical names to control tool visibility. Even if the model manages to request a hidden tool, the dispatcher checks the policy again.

## General Rules

- Tools that are not allowed by the current Profile are usually invisible to the model and cannot be relied on.
- Read-only tools do not modify chat or workspace files.
- Successful workspace writes and edits create checkpoints.
- Tool arguments and results are recorded in the run workspace.
- Large results should not enter chat directly. They become tool results or resource references for later model context.
- Tool results do not trigger SillyTavern's legacy tool message layer.

Tool errors come in two kinds:

| Kind | Behavior |
| --- | --- |
| Recoverable tool error | Returns an `is_error = true` tool result so the model can correct the call |
| Runtime failure | Moves the run to failed state, such as journal, checkpoint, save, or model response structure errors |

## Current Tool Set

| Category | Canonical name | Model alias | Purpose |
| --- | --- | --- | --- |
| Chat | `chat.search` | `chat_search` | Search the current chat |
| Chat | `chat.read_messages` | `chat_read_messages` | Read chat messages by index |
| World Info | `worldinfo.read_activated` | `worldinfo_read_activated` | Read World Info entries activated for this run |
| SKILLS | `skill.list` | `skill_list` | List visible Skill summaries |
| SKILLS | `skill.search` | `skill_search` | Search text files inside one Skill |
| SKILLS | `skill.read` | `skill_read` | Read a Skill file or range |
| Workspace | `workspace.list_files` | `workspace_list_files` | List visible workspace files |
| Workspace | `workspace.search_files` | `workspace_search_files` | Search visible workspace text files |
| Workspace | `workspace.read_file` | `workspace_read_file` | Read a workspace text file |
| Workspace | `workspace.write_file` | `workspace_write_file` | Write a complete UTF-8 file |
| Workspace | `workspace.apply_patch` | `workspace_apply_patch` | Apply a precise replacement to one file |
| Control | `workspace.commit` | `workspace_commit` | Commit a workspace file to chat |
| Control | `workspace.finish` | `workspace_finish` | Finish the Agent run |

There are no MCP, shell, or extension bridge tools today.

## chat.search

Searches the chat bound to the current run. It cannot target another chat.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | Yes | Text to search for |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `role` | string | No | `user`, `assistant`, or `system` |
| `start_message` | integer | No | First 0-based message index |
| `end_message` | integer | No | Last 0-based message index |
| `scan_limit` | integer | No | Limit the number of recent messages scanned |

Results include message indexes, roles, snippets, and refs. Zero hits is a normal result, not an error.

Useful for:

- Looking back through longer chat history.
- Locating keywords before reading exact messages or slices with `chat.read_messages`.

## chat.read_messages

Reads current chat content by 0-based message index. The JSONL header is not counted as a message.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `messages` | array | Yes | Messages to read |
| `messages[].index` | integer | Yes | 0-based message index |
| `messages[].start_char` | integer | No | 0-based character offset inside one message |
| `messages[].max_chars` | integer | No | Maximum characters to read |

Limits:

- Up to 20 messages per call.
- Full read limit is 8000 characters per message.
- Range read limit is 8000 characters per message slice.
- Total return limit is 20000 characters per call.

Missing indexes, invalid ranges, or oversized reads return recoverable tool errors.

## worldinfo.read_activated

Reads the final World Info entries captured for this Agent run. It reads the materialized activation result from this prompt snapshot, not the global last activation.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `entries` | array | No | Omit to list active refs without content |
| `entries[].ref` | string | Yes | Entry ref returned by the index call |
| `entries[].start_char` | integer | No | 0-based character offset inside entry content |
| `entries[].max_chars` | integer | No | Maximum characters to read, maximum 8000 |

Limits:

- Up to 20 entries per call.
- Full read limit is 8000 characters per entry.
- Total return limit is 20000 characters per call.

The recommended pattern is to call it with no arguments first, then read specific entries as needed.

## skill.list

Lists installed Skill summaries visible to the current Profile.

Input:

```json
{}
```

The result includes Skill names, descriptions, and index summaries. It does not read full `SKILL.md` files.

Visibility is controlled by the Profile:

- `skills.visible` decides what can be seen.
- `skills.deny` takes priority over visible.
- `visible: ["*"]` means all installed Skills are visible, still subject to deny.

## skill.search

Searches UTF-8 text files inside one visible Skill.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Skill name from `skill.list` |
| `query` | string | Yes | Search text |
| `path` | string | No | Relative file or directory path inside the Skill |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `context_lines` | integer | No | Context lines around each hit, default 2, maximum 5 |

Results return snippets and refs. Snippet characters count toward this run's Skill read budget, so search cannot bypass `skill.read` budgets.

Hidden Skill, invalid path, binary file, and exhausted budget are recoverable tool errors.

## skill.read

Reads a UTF-8 text file or range from a visible Skill.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Skill name |
| `path` | string | No | Relative path inside the Skill, default `SKILL.md` |
| `max_chars` | integer | No | Maximum characters, default 20000, maximum 80000 |
| `start_line` | integer | No | 1-based starting line |
| `line_count` | integer | No | Number of lines to read |
| `start_char` | integer | No | 0-based character offset |

Line ranges and character ranges cannot be mixed. Original Skill files are read-only resources. If the Agent needs to excerpt, summarize, or rewrite Skill content, it should write to `scratch/`, `summaries/`, or `output/`.

## workspace.list_files

Lists workspace files visible to the current model.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | No | Relative directory or file path. Omit to list visible roots |
| `depth` | integer | No | Listing depth, default 2, maximum 4 |

Visible roots are narrowed by the Profile. Common roots are:

```text
output/
scratch/
plan/
summaries/
persist/
```

Omitted `path`, empty string, `.`, and `./` all mean the workspace root.

## workspace.search_files

Searches visible UTF-8 workspace text files.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | Yes | Search text |
| `path` | string | No | Limit to a file or directory |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `context_lines` | integer | No | Context lines, default 2, maximum 5 |

It searches only model-visible workspace roots. It does not search hidden runtime directories such as `input/`, `tool-results/`, `model-responses/`, `checkpoints/`, or `events.jsonl`.

Zero hits is a normal result.

## workspace.read_file

Reads a visible UTF-8 workspace text file.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative workspace file path |
| `start_line` | integer | No | 1-based starting line |
| `line_count` | integer | No | Number of lines to read |
| `start_char` | integer | No | 0-based character offset |
| `max_chars` | integer | No | Maximum characters, maximum 80000 |

A full read records read-state. `workspace.apply_patch` requires that the file has been fully read, or that it was created or modified by this run. Partial reads are for locating and understanding content.

## workspace.write_file

Writes complete UTF-8 text to a writable workspace path.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative workspace path inside a writable root |
| `content` | string | Yes | Complete file content |

A successful write records read-state and creates a checkpoint.

Good uses:

- Create `output/main.md`.
- Write temporary drafts to `scratch/`.
- Write short durable notes to `persist/` for later runs.

Not suitable for:

- Writing system files.
- Writing outside the workspace.
- Modifying installed Skills.

## workspace.apply_patch

Applies a precise string replacement to one workspace file.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative writable workspace file path |
| `old_string` | string | Yes | Exact text to replace |
| `new_string` | string | Yes | Replacement text |
| `replace_all` | boolean | No | Replace all matches, default `false` |

Requirements:

- The file must have been fully read, or created or modified by this run.
- `old_string` should not include line number prefixes returned by `workspace.read_file`.
- By default, `old_string` must match exactly and uniquely.
- Zero matches, multiple matches, missing full read, and version changes return recoverable tool errors.

Success creates a checkpoint.

## workspace.commit

Commits a visible workspace text file to the current chat message.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | No | Workspace file to publish, default `output/main.md` |
| `mode` | string | No | `replace` or `append`, default `replace` |
| `reason` | string | No | Short commit reason |

Semantics:

- `replace` overwrites this run's Agent message content.
- `append` appends file content to the same Agent message. If the run has not committed yet, it creates the message first.
- Foreground runs must successfully commit at least once before `workspace.finish`.
- Background runs may finish without committing to chat.

Commit is performed by the frontend host bridge and still uses upstream `saveReply()` and the chat save queue.

## workspace.finish

Finishes the current Agent run.

Input:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `reason` | string | No | Short completion reason |

If a foreground run has not successfully called `workspace.commit`, finish will fail. Background runs can finish without a commit.

After `workspace.finish` succeeds, the run enters cleanup and promotes successful `persist/` changes back to the stable chat workspace. Failed or cancelled runs do not write back to the persistent workspace.

## Tool Configuration in Profiles

Profiles control tools with canonical names:

```json
{
  "tools": {
    "allow": [
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

`deny` takes priority over `allow`. If the system prompt asks the Agent to use a disabled tool, the Agent will usually fail or repeatedly receive recoverable tool errors. Creators should keep prompts and tool policy aligned.

## Related Pages

- Starting and subscribing to runs: [Agent API](/en/api/agent).
- Skill management API: [Skill API](/en/api/skill).
- Workspace concepts: [Agent System Architecture](/en/architecture/agent).
