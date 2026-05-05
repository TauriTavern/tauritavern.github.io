---
description: Understand and manage TauriTavern Agent Profiles.
---

# Agent Profiles

An Agent Profile describes the policy for an Agent run.

It is not merely a model picker. In the current stage, the model and API still follow the original generation context for the run. The profile mainly decides what the Agent can see, which tools it may use, which SKILLS it may read, which workspace roots are visible or writable, and how many rounds it may take.

## Built-In Profile

TauriTavern includes one built-in profile:

```text
default-writer
```

It is a general writing profile suitable for ordinary chats and first-stage Agent creation.

The built-in profile cannot be edited or deleted directly. If you want to change it, copy it first and edit the copy.

## Profile Management

Open the Agent System panel and use the `Profiles` tab to:

- Create a profile.
- Copy an existing profile.
- Save a profile.
- Export a profile.
- Delete a custom profile.
- Switch between form editing and advanced JSON.

The form is best for everyday adjustments. Advanced JSON is useful for migration, backup, or precise edits. If you are unsure what a field means, prefer the form.

## Identity

| Field | Meaning |
| --- | --- |
| Profile ID | Stable identifier. Prefer lowercase letters, digits, `-`, and `_` |
| Display name | The name shown in the panel |
| Description | A short note about what this profile is for |

Profile IDs should be stable. If you distribute a profile, avoid changing the ID often; otherwise users may find it hard to tell whether two versions belong to the same strategy.

## Run Policy

Run policy controls the basic shape of an Agent run.

| Field | Current meaning |
| --- | --- |
| Presentation | `foreground` runs must submit a chat message; `background` runs may complete without writing to chat |
| Plan mode | Currently only `none` is open. Fuller Plan Mode belongs to later work |
| Max rounds | Maximum model and tool-loop rounds |
| Max tool calls | Maximum total tool calls in this run |
| Model retries | Retries for transient model errors |
| Retry interval | Time between retries |

::: tip
For ordinary writing, start with the default round limits. A limit that is too low may stop Agent before it can read and commit; a limit that is too high may increase wait time and cost.
:::

## Agent System Prompt

The `Agent system prompt` is the run instruction for Agent. It is a good place to describe:

- The writing goal of this profile.
- When Agent should search history.
- How Agent should use SKILLS.
- Which file should receive the output.
- What the profile should avoid or handle with restraint.

It is not the best place for large bodies of world lore. Longer material belongs in SKILLS, where Agent can read it when needed.

## Capability Matrix

The capability matrix decides which tools the model can see.

Current built-in tools are grouped into five areas:

| Area | Tools |
| --- | --- |
| Context | `chat.search`, `chat.read_messages`, `worldinfo.read_activated` |
| SKILLS | `skill.list`, `skill.search`, `skill.read` |
| Workspace read | `workspace.list_files`, `workspace.search_files`, `workspace.read_file` |
| Workspace write | `workspace.write_file`, `workspace.apply_patch` |
| Control | `workspace.commit`, `workspace.finish` |

If a tool is not allowed, Agent usually cannot see it and should not rely on it. Foreground runs should normally keep `workspace.commit` and `workspace.finish`, otherwise Agent cannot submit the final content and close the run.

## SKILLS Access

A profile can limit which SKILLS Agent may read.

| Field | Meaning |
| --- | --- |
| Visible SKILLS | Skill names Agent may read. `*` means all are visible |
| Denied SKILLS | Skill names explicitly blocked |
| Max chars per call | Maximum characters read from Skill files in one call |
| Max chars per run | Total Skill read budget for the run |

Deny takes precedence over allow. Even if visible SKILLS is `*`, a denied Skill remains hidden.

## Workspace Access

Workspace access is split into `visible` and `writable`.

| Root | Suggested use |
| --- | --- |
| `output` | Final replies and other output artifacts |
| `scratch` | Temporary drafts and working notes |
| `plan` | Planning files |
| `summaries` | Summaries and stage notes |
| `persist` | Information that later runs in the same chat should keep using |

A writable root must also be visible. If a root is hidden, Agent cannot read it. If it is visible but not writable, Agent cannot modify it.

## Output Artifact

The main user-visible output artifact today is the message body. Its default path is:

```text
output/main.md
```

If you change the message body path, make sure the Agent system prompt, workspace permissions, and commit behavior all point to the same path. Otherwise Agent may write a file but fail to submit the intended content.

## Maintenance Advice

When distributing an Agent Profile, a few simple habits help:

- Let one profile serve one main workflow.
- Start with fewer tools and open more only when needed.
- Put short instructions in the system prompt and long material in SKILLS.
- Do not depend on Plan Mode, MCP, diff, rollback, or model switching before those are open user features.
- Export only after testing the profile once in a clean chat.

