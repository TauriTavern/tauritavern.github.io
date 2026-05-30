---
description: Current built-in TauriTavern Agent tools, inputs, result semantics, and limits.
---

# Agent Tool Reference

Agent tools are how the model acts inside a constrained workspace. They can read chat, inspect world info activated for the current run, read SKILLS on demand, operate on workspace files, delegate to SubAgents, and submit output when the work is done.

Tool calls are Agent run events. They are not written as chat messages. The chat stores only the final committed content.

[[toc]]

## Names and Visibility

Each tool has two names:

| Name | Example | Used for |
| --- | --- | --- |
| Canonical name | `workspace.apply_patch` | Profiles, timeline events, and documentation |
| Model-facing alias | `workspace_apply_patch` | Function names exposed to the model and provider |

Profiles use canonical names to control tool visibility. Even if the model asks for a hidden tool, the dispatcher checks visibility again.

## General Rules

- Tools not allowed by the current Profile are usually hidden from the model and should not be relied on.
- Read-only tools do not modify chat or workspace state.
- Successful workspace writes or edits create checkpoints.
- Tool arguments and results are recorded in the run workspace.
- Large results should not be placed directly into chat. They enter later model context as tool results and resource references.
- Tool results do not create Legacy SillyTavern tool message rows.
- Child task tools are still limited by the parent Agent and target Profile budgets.

Tool errors have two broad forms:

| Type | Behavior |
| --- | --- |
| Recoverable tool error | Returned as a tool result with `is_error = true`, so the model can correct the request |
| Runtime failure | The run enters `failed`, for example when journal, checkpoint, save, or model response structure fails |

## Current Tool Overview

| Area | Canonical name | Model alias | Purpose |
| --- | --- | --- | --- |
| Agent collaboration | `agent.list` | `agent_list` | Find Agents that can be called |
| Agent collaboration | `agent.delegate` | `agent_delegate` | Start a child task for another Agent |
| Agent collaboration | `agent.await` | `agent_await` | Wait for or inspect child task results |
| Agent collaboration | `task.return` | `task_return` | Let a SubAgent return its result and end the child task |
| Chat | `chat.search` | `chat_search` | Search the current chat |
| Chat | `chat.read_messages` | `chat_read_messages` | Read chat messages by index |
| World info | `worldinfo.read_activated` | `worldinfo_read_activated` | Read world info entries activated for this run |
| SKILLS | `skill.list` | `skill_list` | List visible Skill summaries |
| SKILLS | `skill.search` | `skill_search` | Search text files inside one Skill |
| SKILLS | `skill.read` | `skill_read` | Read a Skill file or range |
| Workspace | `workspace.list_files` | `workspace_list_files` | List visible workspace files |
| Workspace | `workspace.search_files` | `workspace_search_files` | Search visible workspace text files |
| Workspace | `workspace.read_file` | `workspace_read_file` | Read a workspace text file |
| Workspace | `workspace.write_file` | `workspace_write_file` | Write or append UTF-8 text |
| Workspace | `workspace.apply_patch` | `workspace_apply_patch` | Apply a precise replacement in one file |
| Control | `workspace.commit` | `workspace_commit` | Commit a workspace file to chat |
| Control | `workspace.finish` | `workspace_finish` | End the Agent run |
| Randomness | `dice.roll` | `dice_roll` | Roll dice when a task explicitly needs randomness |

There are no MCP, shell, extension bridge, or user-facing `agent.handoff` tools today.

## agent.list

Lists other Agents the current Agent can ask for help. This tool is read-only and does not start work.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `purpose` | string | No | `any`, `delegate`, or `handoff`; default `any` |
| `query` | string | No | Filter by Agent ID, display name, or description |
| `limit` | integer | No | Maximum results, default 8, maximum 20 |

The current practical use is delegation. `handoff` is reserved as a purpose value; it does not mean a user-facing handoff tool is open.

The result includes callable Agent IDs, display names, descriptions, and usage hints. Whether a target is visible also depends on the target Profile's `callable`, `allowAsSubagent`, and allowed caller settings.

## agent.delegate

Starts a focused child task for another Agent. After delegating, the parent Agent can continue working or use `agent.await` to wait for the result.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `agentId` | string | Yes | Target Agent ID from `agent.list` |
| `task` | object | Yes | Child task brief |
| `task.objective` | string | Yes | What the child task should accomplish |
| `task.title` | string | No | Short task label for display |
| `task.context` | object | No | Relevant facts, limits, draft text, file paths, or notes |
| `task.expectedOutput` | object | No | Desired result shape, such as summary, review result, or artifact reference |
| `budget` | object | No | Optional child task budget |
| `budget.maxRounds` | integer | No | Child task round limit; cannot exceed the target Profile limit |
| `budget.maxToolCalls` | integer | No | Child task tool-call limit; cannot exceed the target Profile limit |

Limits:

- The current Agent must allow creating child Agents.
- The target Profile must be callable and allow running as a SubAgent.
- The target Profile model must be [configured](/en/agent/faq#agent-profile-model-from-api-connection).
- The caller must be allowed by the target Profile.
- Delegation count and concurrency are limited by the parent Profile.

A good `objective` describes the result, not just the steps. For example, "Check whether `output/main.md` matches the character voice and return at most five concrete issues" is better than "Read the file, analyze it, and tell me."

## agent.await

Waits for or checks child tasks started by the parent Agent.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `taskIds` | array | No | Task IDs to wait for. Omit to target tasks started in this run |
| `mode` | string | No | `nextCompleted`, `allCompleted`, or `statusOnly`; default `nextCompleted` |
| `timeoutMs` | integer | No | Wait timeout, default 120000, maximum 300000 |

Modes:

| Mode | Meaning |
| --- | --- |
| `nextCompleted` | Wait until any selected task completes |
| `allCompleted` | Wait until all selected tasks complete |
| `statusOnly` | Check status without waiting |

An Agent can only await tasks started by the current parent invocation. A timeout returns current status and a warning; it does not mean every child task failed.

## task.return

Used by a SubAgent to return its result and end the child task. This tool appears only during child task runs. Ordinary main Agents should not call it directly.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `summary` | string | Yes | Concise result summary for the parent Agent |
| `status` | string | No | `completed` or `failed`; default `completed` |
| `confidence` | string | No | `low`, `medium`, or `high` |
| `artifacts` | array | No | Child task artifact references |
| `artifacts[].path` | string | Yes | Task-visible workspace path |
| `artifacts[].kind` | string | Yes | Artifact format, such as `markdown`, `json`, or `text` |
| `artifacts[].role` | string | Yes | Suggested use, such as `draft`, `outline`, or `evidence` |
| `findings` | array | No | Structured findings |
| `warnings` | array | No | Issues the parent Agent should notice |
| `suggestedNextActions` | array | No | Suggested next steps for the parent Agent |
| `questionsForCaller` | array | No | Questions that still need parent Agent or user input |

After return, the runtime records the result in child task result files and summary paths. The parent Agent can see it through `agent.await`.

## chat.search

Searches the chat bound to the current run. It cannot target other chats.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `query` | string | Yes | Search text |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `role` | string | No | `user`, `assistant`, or `system` |
| `start_message` | integer | No | Start 0-based message index |
| `end_message` | integer | No | End 0-based message index |
| `scan_limit` | integer | No | Limit how many recent messages are scanned |

The result returns message indexes, roles, snippets, and references. Zero hits is a normal result, not an error.

Good uses:

- Looking back through longer chat history.
- Finding a keyword first, then reading full messages with `chat.read_messages`.

## chat.read_messages

Reads current chat content by 0-based message index. The JSONL header is not counted as a message.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `messages` | array | Yes | Messages to read |
| `messages[].index` | integer | Yes | 0-based message index |
| `messages[].start_char` | integer | No | 0-based character offset within one message |
| `messages[].max_chars` | integer | No | Maximum characters to read |

Limits:

- At most 20 messages per call.
- At most 8000 characters for one full message read.
- At most 8000 characters for a partial read of one message.
- At most 20000 returned characters per call.

Missing indexes, invalid ranges, or oversized reads return recoverable tool errors.

## worldinfo.read_activated

Reads the final world info entries activated for this Agent run. It reads the materialized activation result captured in this run's prompt snapshot, not a global last-activation value.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `entries` | array | No | Omit to list activated entry references without body text |
| `entries[].ref` | string | Yes | Entry reference returned by the index call |
| `entries[].start_char` | integer | No | 0-based character offset inside entry text |
| `entries[].max_chars` | integer | No | Maximum characters to read, maximum 8000 |

Limits:

- At most 20 entries per call.
- At most 8000 characters for one full entry read.
- At most 20000 returned characters per call.

Recommended use: call without arguments first to inspect activated entries, then read specific entries as needed.

## skill.list

Lists visible installed Skill summaries for the current Profile.

Input:

```json
{}
```

The result contains Skill names, descriptions, and index summaries. It does not read the full `SKILL.md`.

Visibility is decided by both scope and Profile policy:

- Agent resolves global, preset, Profile, and character Skills relevant to the run.
- `skills.visible` decides the final visible set.
- `skills.deny` takes precedence over visible.
- `visible: ["*"]` means all resolved Skills are visible, unless denied.

## skill.search

Searches UTF-8 text files inside one visible Skill.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string | Yes | Skill name from `skill.list` |
| `query` | string | Yes | Search text |
| `path` | string | No | Relative file or directory path inside the Skill |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `context_lines` | integer | No | Context lines around each hit, default 2, maximum 5 |

The result returns snippets and refs. Snippet characters count toward the run's Skill read budget, so search cannot bypass `skill.read` budgets.

Hidden Skills, invalid paths, binary files, or exhausted budgets return recoverable tool errors.

## skill.read

Reads a UTF-8 text file or range inside a visible Skill.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string | Yes | Skill name |
| `path` | string | No | Relative path inside the Skill, default `SKILL.md` |
| `max_chars` | integer | No | Maximum returned characters, default 20000, maximum 80000 |
| `start_line` | integer | No | 1-based starting line |
| `line_count` | integer | No | Number of lines to read |
| `start_char` | integer | No | 0-based character offset |

Line ranges and character ranges cannot be mixed. Skill source files are read-only. If Agent needs to quote, summarize, or rewrite material, it should write into `scratch/`, `summaries/`, or `output/`.

## workspace.list_files

Lists workspace files visible to the current model.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `path` | string | No | Relative directory or file path; omit to list visible roots |
| `depth` | integer | No | Listing depth, default 2, maximum 4 |

Visible roots are narrowed by the Profile. Common roots are:

```text
output/
scratch/
plan/
summaries/
persist/
```

Omitted `path`, empty string, `.`, and `./` all refer to the workspace root.

## workspace.search_files

Searches UTF-8 text files in the visible workspace.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `query` | string | Yes | Search text |
| `path` | string | No | Limit search to a file or directory |
| `limit` | integer | No | Maximum hits, default 20, maximum 50 |
| `context_lines` | integer | No | Context lines, default 2, maximum 5 |

It searches only visible workspace roots. It does not search hidden run directories such as `input/`, `tool-results/`, `model-responses/`, `checkpoints/`, or `events.jsonl`.

Zero hits is a normal result.

## workspace.read_file

Reads a UTF-8 text file in the visible workspace.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative workspace file path; must be a file, not a directory |
| `start_line` | integer | No | 1-based starting line |
| `line_count` | integer | No | Number of lines to read |
| `start_char` | integer | No | 0-based character offset |
| `max_chars` | integer | No | Maximum returned characters, maximum 80000 |

Read output includes line numbers. Do not include those line number prefixes in `old_string` when using `workspace.apply_patch`.

Read the exact text before patching. If a patch fails, fully read the file before retrying.

## workspace.write_file

Writes UTF-8 text to a writable workspace path.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative workspace path under a writable root |
| `content` | string | Yes | Full file content for replace, or exact text to append |
| `mode` | string | No | `replace` or `append`, default `replace` |

Semantics:

- `replace` writes the complete file.
- `append` adds `content` exactly to the end of the file. Include a newline in `content` if you want one.
- If the file does not exist, append creates it.

Successful writes record read-state and create a checkpoint.

Good uses:

- Create `output/main.md`.
- Write temporary drafts to `scratch/`.
- Store short information for later runs in `persist/`.
- Record stage summaries or child task summaries in `summaries/`.

Not for:

- Writing system files.
- Writing outside the workspace.
- Modifying installed Skills.

## workspace.apply_patch

Applies a precise string replacement in one workspace file.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `path` | string | Yes | Relative writable workspace file path |
| `old_string` | string | Yes | Exact text to replace |
| `new_string` | string | Yes | Replacement text |
| `replace_all` | boolean | No | Replace every match, default `false` |

Requirements:

- `old_string` should come from text already read, or from a file created or replaced in this run.
- `old_string` must not include line number prefixes from `workspace.read_file` output.
- By default, `old_string` must match exactly and uniquely.
- Zero matches, multiple matches, or version changes return recoverable tool errors.

Successful patches create a checkpoint.

## workspace.commit

Commits a visible workspace text file to the current chat message.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `path` | string | No | Workspace file to publish, default `output/main.md` |
| `mode` | string | No | `replace` or `append`, default `replace` |
| `reason` | string | No | Short commit reason |

Semantics:

- `replace` overwrites the Agent message for this run.
- `append` adds file content to the same Agent message. If the run has not committed yet, it creates the message first.
- Foreground runs must commit successfully at least once before `workspace.finish`.
- Background runs may finish without committing to chat.

Chat commit is bridged through the frontend host and still uses upstream `saveReply()` and the chat save queue.

## workspace.finish

Ends the current Agent run.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `reason` | string | No | Short completion reason |

In a foreground run, finish fails if `workspace.commit` has not succeeded yet. Background runs can finish without a chat commit.

After `workspace.finish` succeeds, the run enters cleanup and promotes successful `persist/` changes back into the stable chat workspace. Failed or cancelled runs do not write back persistent workspace changes.

## dice.roll

Rolls dice for tasks that explicitly need randomness, such as tabletop play, roleplay checks, or random events. It is read-only, but not idempotent: the same formula may produce a different result each time.

Input:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `formula` | string | Yes | Dice formula such as `d6`, `1d20`, `3d6+4`, `2d10-1`, or plain `20` for `1d20` |

If the task does not need randomness, do not enable this tool. Default writing Profiles usually do not need it.

## Tool Configuration in Profiles

Profiles use canonical names to control tools:

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

`deny` takes precedence over `allow`. If the system prompt asks for a disabled tool, Agent may fail or repeatedly receive recoverable tool errors. Creators should keep tool policy and prompt instructions consistent.

A few practical notes:

- Foreground Profiles usually need `workspace.commit` and `workspace.finish`.
- Main Agents that delegate tasks need `agent.list`, `agent.delegate`, and `agent.await`.
- `task.return` is supplied by the runtime for child tasks and should not be placed in an ordinary Profile's `allow` list.
- Enable `dice.roll` only when the play style explicitly needs randomness.

## Related Pages

- Starting and subscribing to runs: [Agent API](/en/api/agent).
- SubAgent usage: [SubAgent](/en/agent/subagents).
- Skill management API: [Skill API](/en/api/skill).
- Workspace concepts: [Agent System Architecture](/en/architecture/agent).
