---
description: Practical guidance for preset, character card, and play-style creators adapting content for TauriTavern Agent.
---

# Creator Adaptation Guide

The TauriTavern Agent system continues SillyTavern's tradition of giving creators room to shape the experience. Through prompts, Agent Profiles, and SKILLS, creators can prepare a steadier environment for a specific play style.

This guide does not require you to understand the backend implementation. It focuses on how to organize Agent-related content clearly, gently, and maintainably when sharing it with users.

## Start With the Workflow

Do not begin by asking, "Which tools should I enable?" A better starting point is:

- What problem does the user most often face in this play style?
- What material does Agent need to read to answer well?
- Which outputs must be stable, such as body text, status blocks, side scenes, or summaries?
- Where should the model have freedom, and where should the creator set firm boundaries?

If the only goal is a more polished voice, an ordinary preset may already be enough. Agent is more useful when the work involves reference material, multi-step writing, or durable state.

## Put Content in the Right Place

A simple rule of thumb:

| Content | Recommended place |
| --- | --- |
| Short rules that must apply every run | Agent system prompt |
| Long writing methods or examples | SKILLS |
| Durable character state or unresolved threads | `persist/` or a future memory mechanism |
| Drafts and working notes for this run | `scratch/` |
| Final reply body | `output/main.md` |
| Prompt structure that still belongs to ordinary SillyTavern | Existing presets and character cards |

This keeps prompts from growing too large and makes troubleshooting easier for users.

## Designing Profiles

An Agent Profile should serve one clear goal. For example:

- `story-polisher`: polish the current reply.
- `lore-aware-writer`: emphasize world info and history search.
- `status-bar-writer`: generate a stable status block format.
- `memory-summarizer`: organize summaries or durable notes in the background.

When configuring a profile, ask:

- Does it need to read chat history?
- Does it need activated world info?
- Does it need SKILLS?
- May it write to `persist/`?
- Must it submit a chat message?
- Is the round limit enough for the task?

Ordinary foreground writing profiles should usually keep:

```text
chat.search
chat.read_messages
worldinfo.read_activated
skill.list
skill.search
skill.read
workspace.read_file
workspace.write_file
workspace.apply_patch
workspace.commit
workspace.finish
```

If you disable `workspace.commit`, a foreground Agent cannot submit the reply to chat. Unless you are deliberately building a background task, this is usually not recommended.

## Writing the Agent System Prompt

The Agent system prompt does not need to be a wall of commands. It works better as a concise work brief:

```text
You are the writing Agent for this play style.

First understand the current chat context. If the relationship, plot, or setting is unclear, prefer searching chat history and reading the world info activated for this run.

Write the final reply to output/main.md and commit it before finishing.

If writing-style guidance is needed, list visible SKILLS first, then read the relevant files as needed. Do not place temporary analysis in the final reply.
```

You can emphasize goals without making the prompt harsh. Clear steps are usually more stable than a long chain of prohibitions.

## Organizing SKILLS

A Skill distributed to users should stay small and clear.

Recommended structure:

```text
my-card-writing/
  SKILL.md
  references/
    tone.md
    relationship-pacing.md
    status-bar-format.md
  examples/
    short-reply.md
```

`SKILL.md` should act as navigation. It does not need to contain everything. It can explain:

- Which characters or play styles the Skill is for.
- Which files Agent should read first.
- Which content is reference, and which content is a format requirement.
- Which Agent Profile is recommended, if the Skill is paired with one.

## Compatibility When Agent Mode Is Off

Not every user will enable Agent Mode. When distributing content, it is best to keep two layers:

- With Agent Mode off, the preset or character card still works normally.
- With Agent Mode on, Agent Profiles and SKILLS provide a stronger workflow.

In other words, Agent support is best treated as an enhancement, not the only entrance.

## Use Durable Information Carefully

`persist/` lets later Agent runs in the same chat continue to see selected information. It is useful, but it should be used with restraint.

Good candidates:

- Important but short plot facts.
- Open questions.
- Character relationship state.
- Writing preferences the user has clearly expressed.

Poor candidates:

- Complete chat logs.
- Agent reasoning.
- One-off drafts.
- Raw tool-call results.
- Sensitive information the user did not agree to save.

## Before Publishing

Before sharing Agent-adapted content, a small checklist helps:

- With Agent Mode off, the original play style still runs.
- With Agent Mode on, a normal send completes and commits.
- The timeline does not show repeated tool failures.
- The profile does not rely on unopened features.
- SKILLS can be imported, previewed, read, and exported.
- If tools are restricted, the system prompt does not ask Agent to use disabled tools.
- If the output path is changed, the commit path and prompt agree.

Creators do not need to use every Agent capability at once. A small profile with clear boundaries and reliable behavior is often better for users than a large profile that looks powerful but is hard to maintain.

