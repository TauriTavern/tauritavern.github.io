---
description: Understand and manage TauriTavern Agent Profiles.
---

# Agent Profiles

An Agent Profile describes how an Agent runs. It is the run policy for that Agent: which preset assembles context, which model is called, which tools and SKILLS are visible, whether other Agents may call it, which workspace roots can be read or written, and how final content is submitted to chat.

Most users only need to choose the current Profile. Creators can copy, adjust, and distribute Profiles for specific workflows.

## Built-In Profile

TauriTavern includes one built-in profile:

```text
default-writer
```

It is a general writing profile for ordinary chats and creative use. It can read chat, world info, SKILLS, and workspace files. When allowed, it can also delegate focused work to SubAgents.

The built-in profile cannot be edited or deleted directly. If you want to change it, copy it first and edit the copy.

## Active Profile and Edited Profile

The Agent System panel has two concepts that are easy to mix up:

| Item | Meaning |
| --- | --- |
| `Active Profile` | The Profile used by the next Agent run |
| Edited Profile | The Profile currently open in the panel |

Editing a Profile does not automatically make it active. Check `Active Profile` before running Agent.

Profiles that can only run as SubAgents do not appear in the `Active Profile` list. If the active Profile is changed into a SubAgent-only Profile, TauriTavern resets the active Profile to `default-writer` so the next generation can still start.

## Management

Open the Agent System panel and use the `Profiles` tab to:

- Create a profile.
- Copy an existing profile.
- Save a profile.
- Export a profile.
- Delete a custom profile.
- Switch between form editing and advanced JSON.

The form is best for everyday changes. Advanced JSON is useful for backup, migration, or checking the full structure. If you are unsure what a field means, prefer the form.

## Identity

| Field | Meaning |
| --- | --- |
| Profile ID | Stable identifier. Prefer lowercase letters, digits, `-`, and `_` |
| Display name | The name shown in the panel |
| Description | A short note about what this Profile is for |

Profile IDs should be stable. If you distribute a Profile, avoid changing the ID often; otherwise users may find it hard to tell whether two versions belong to the same strategy.

## Preset Binding

Preset binding decides how Agent prompt context is assembled. A Profile can use three modes:

| Mode | Good fit |
| --- | --- |
| Current prompt snapshot | Use the context already prepared for the current chat; closest to ordinary generation |
| Preset reference | Make this Profile assemble Agent prompts with a fixed preset |
| No preset binding | Do not reference a fixed preset; useful for a few background or specialized tasks |

If you want an Agent to always work with one preset, use a preset reference. Then changing the ordinary chat preset will not accidentally change that Agent's prompt assembly.

Independent preset assembly currently targets OpenAI/chat-completion presets. If a referenced preset is not runnable for Agent, the run fails clearly.

## Model Binding

Model binding decides which model the Agent calls. A Profile supports:

| Mode | Meaning |
| --- | --- |
| Current prompt snapshot | Use the model and connection captured from this generation |
| Bound model connection | Use a model that was [saved in API Connection Settings](/en/agent/faq#agent-profile-model-from-api-connection) |
| Requires configuration | This imported or shared Profile needs the user to [choose a local model](/en/agent/faq#agent-profile-model-from-api-connection) |

Independent models are useful when:

- The main chat uses one model, but Agent should use another model that handles tools better.
- The main Agent uses a stronger model, while SubAgents use faster or cheaper models.
- A creator distributes a Profile without exposing local connections or secrets.

Exported Profiles do not carry local model connections. If a user imports a Profile and sees `requires configuration`, they only need to [select a usable model](/en/agent/faq#agent-profile-model-from-api-connection) in that Profile.

## Run Policy

Run policy controls the basic shape of an Agent run.

| Field | Meaning |
| --- | --- |
| Presentation | Foreground runs must submit a chat message; background runs may complete without writing to chat |
| Plan mode | Currently mainly `none`; fuller Plan Mode belongs to later work |
| Max rounds | Maximum model and tool-loop rounds |
| Max tool calls | Maximum total tool calls in this run |
| Model retries | Retries for transient model errors |
| Retry interval | Time between retries |

::: tip
For ordinary writing, start with the default round limits. A limit that is too low may stop Agent before it can read and commit. A limit that is too high may increase wait time and cost.
:::

## Initial Context

A Profile can control how much chat history Agent receives at the start.

| Setting | Meaning |
| --- | --- |
| `-1` | Follow the current prompt assembly result without trimming chat history |
| `0` | Do not include chat history by default; useful for very focused background tasks |
| Positive integer | Include at most the latest N chat messages |

It can also decide whether to include activated world info. For ordinary writing, keeping world info is usually sensible. For a SubAgent that only checks format, summarizes, or reviews a draft, a narrower context may work better.

## SubAgent and Delegation

SubAgent policy decides whether a Profile can call other Agents and whether other Agents can call it.

| Setting | Meaning |
| --- | --- |
| Can create child Agents | This Agent can use `agent.delegate` to start child tasks |
| Allow as SubAgent | This Profile can run in return-mode as a background SubAgent |
| Allowed callers | Restricts which Profiles may call it; `*` means no caller restriction |
| Max concurrent child tasks | How many child tasks may run at the same time |
| Max child tasks per run | How many child tasks may be started in one run |
| Result budget | Budget for child task results returned to the parent Agent |

If a Profile should only be used as a SubAgent, enable `Allow as SubAgent` and save it. See [SubAgent](/en/agent/subagents) for more detail.

## Agent System Prompt

The `Agent system prompt` is the run instruction for Agent. It is a good place to describe:

- The writing goal of this Profile.
- When Agent should search history.
- How Agent should use SKILLS.
- Whether it may delegate work to SubAgents.
- Which file should receive the output.
- What the Profile should avoid or handle with restraint.

It is not the best place for large bodies of world lore. Longer material belongs in SKILLS, where Agent can read it when needed.

If you want shorter, more conversational replies, you can say so in the system prompt:

```text
If this turn is better as short conversation, split the reply into several short parts and use append commits to add them one by one. Do not expand only to make the reply longer.
```

This fits casual chat, light character interaction, and everyday scenes. For full prose, status blocks, or structured output, a normal replace commit is usually more stable.

## Capability Matrix

The capability matrix decides which tools the model can see. Current built-in tools are grouped like this:

| Area | Tools |
| --- | --- |
| Agent collaboration | `agent.list`, `agent.delegate`, `agent.await`, `task.return` |
| Chat | `chat.search`, `chat.read_messages` |
| World info | `worldinfo.read_activated` |
| SKILLS | `skill.list`, `skill.search`, `skill.read` |
| Workspace read | `workspace.list_files`, `workspace.search_files`, `workspace.read_file` |
| Workspace write | `workspace.write_file`, `workspace.apply_patch` |
| Chat commit | `workspace.commit`, `workspace.finish` |
| Randomness | `dice.roll` |

If a tool is not allowed, Agent usually cannot see it and should not rely on it. Foreground runs should normally keep `workspace.commit` and `workspace.finish`; otherwise Agent cannot submit the final content and close the run.

`task.return` is provided by the runtime while a SubAgent is running. It should not be added manually to an ordinary Profile tool list. `dice.roll` should be enabled only when the play style explicitly needs dice or random checks.

Short conversational replies also depend on `workspace.commit`. The difference is append mode, which lets one run add content to the same Agent message more than once.

## SKILLS Access

A Profile can limit which SKILLS Agent may read.

| Field | Meaning |
| --- | --- |
| Visible SKILLS | Skill names Agent may read. `*` means all are visible |
| Denied SKILLS | Skill names explicitly blocked |
| Max chars per call | Maximum characters read from Skill files in one call |
| Max chars per run | Total Skill read budget for the run |

Deny takes precedence over allow. Even if visible SKILLS is `*`, a denied Skill remains hidden.

In 2.1.0, Skills can also belong to different scopes: global, preset, Profile, or character. Agent first resolves the Skills relevant to the current run, then applies the Profile's visible and denied lists.

## Workspace Access

Workspace access is split into `visible` and `writable`.

| Root | Suggested use |
| --- | --- |
| `output` | Final replies and other output artifacts |
| `scratch` | Temporary drafts and working notes |
| `plan` | Planning files |
| `summaries` | Summaries, stage notes, and child task results |
| `persist` | Information that later runs in the same chat should keep using |

A writable root must also be visible. If a root is hidden, Agent cannot read it. If it is visible but not writable, Agent cannot modify it.

SubAgents see a narrowed task workspace. They may read task instructions and summaries from the parent Agent, and they can write results to agreed summary locations, but they do not take over the parent's foreground commit.

## Output Artifact

The main user-visible output artifact today is the message body. Its default path is:

```text
output/main.md
```

If you change the message body path, make sure the Agent system prompt, workspace permissions, and commit behavior all point to the same path. Otherwise Agent may write a file but fail to submit the intended content.

## Export and Sharing

When sharing a Profile, creators should say:

- Whether this Profile is a main Agent or is only meant to be used as a SubAgent.
- Whether users need to [bind a model again](/en/agent/faq#agent-profile-model-from-api-connection).
- Whether it depends on a preset, character, or Skill.
- Whether it needs tools such as `agent.delegate` or `dice.roll`, which may not be enabled by default.

Exported Profiles try not to carry local connection information. Re-selecting a model after import is normal; it does not mean the Profile is broken.

## Maintenance Advice

When maintaining an Agent Profile, a few simple habits help:

- Let one Profile serve one main workflow.
- Start with fewer tools and open more only when needed.
- Keep system prompt rules short. Put long material in SKILLS.
- Use SubAgents for clear, local tasks that can return a concrete result. Do not add delegation only to make the workflow look more complex.
- Export only after testing the Profile once in a clean chat.
