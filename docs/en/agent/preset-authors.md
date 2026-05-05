---
description: Agent PromptManager guidance for TauriTavern preset authors.
---

# Preset Author Guide

This page is for authors who are already comfortable with presets, PromptManager, and prompt order.

Agent Mode does not move preset authors away from the existing creation system. It keeps one of the most valuable parts of that system: you can still decide how context is arranged, where character information sits, how World Info before and after relate to the rest of the prompt, and which instructions stay close to chat history.

The difference is that Agent adds two dedicated PromptManager components:

```text
Agent System Prompt
Agent Results
```

Both can be moved in the preset order. Understanding what they mean is the key to making presets and Agent Profiles work together steadily.

## Three Layers

Presets, Profiles, and SKILLS have different jobs:

| Layer | Main responsibility |
| --- | --- |
| Preset | Controls the order of ordinary prompts and Agent-specific position blocks |
| Agent Profile | Controls the Agent system prompt, tools, SKILLS, workspace permissions, presentation, and output policy |
| SKILLS | Hold longer writing methods, examples, format rules, and reference material |

A gentle rule of thumb: the preset decides where things go, the Profile decides what the Agent may do and how it should work, and SKILLS hold material the Agent can read when needed.

## Agent System Prompt

`Agent System Prompt` is a position anchor in the preset. It is not the content source.

When Agent Mode starts, the frontend places an internal marker at this position. The backend runtime then replaces that marker with the system prompt resolved from the current Agent Profile. In other words, the real Agent system prompt comes from `instructions.agentSystemPrompt` in the Profile, not from text written into this preset block.

This has a few practical consequences:

- Do not write behavioral instructions into the preset's `Agent System Prompt` block.
- To change Agent behavior, edit or distribute an Agent Profile.
- This position must exist. If it is missing, the Agent run fails clearly instead of falling back silently.
- Older presets that do not have this position are given a default reference when possible.

The default order places it before `Main Prompt`. That is usually a safe choice, because the Agent work brief enters the context before the ordinary main prompt.

If you have a clear reason to move it, move it by intent:

| Placement | Good fit |
| --- | --- |
| Early, near `Main Prompt` | The Agent work brief should frame the whole writing task first |
| After character, World Info, or persona material | The Agent should see core setting first, then receive this Profile's work brief |
| Near chat history | The Agent action rules should sit close to this turn's conversation context |

Avoid moving it often. Its position changes how the Profile system prompt relates to the rest of the context. It is best to change one factor at a time and test with the same chat.

## Agent Results

`Agent Results` brings previously committed Agent results back into a later Agent prompt.

It does not place raw tool logs, drafts, or hidden workspace files into the context. It reads Agent commit metadata and message text saved on chat messages, then places them as system messages at the `Agent Results` position.

It helps later Agent runs know:

- Which chat messages came from Agent.
- The earlier `runId`, `workspaceId`, `checkpointId`, and commit information.
- The final text that was committed to chat.

`Agent Results` can be moved. It can also be disabled when you intentionally do not want later Agent runs to see previous Agent results.

Common placements:

| Placement | Good fit |
| --- | --- |
| Near chat history | Previous Agent output should behave like part of the conversation context |
| Before Post-History Instructions | Final post-history rules should still constrain how Agent uses these results |
| Disabled | The play style avoids previous Agent results, or old results tend to cause repetition |

`Agent Results` uses context budget. Long or older Agent results may be omitted when the budget is exhausted. This is normal budget behavior, so it should not be treated as unlimited memory.

Short durable facts belong in `persist/` or a future memory mechanism. Longer writing rules belong in SKILLS.

## Relationship to Agent Profiles

The relationship between a preset and a Profile can be read this way:

```text
The preset decides where the Profile system prompt enters the prompt.
The Profile decides what that system prompt says and what the Agent may do.
```

`instructions.agentSystemPrompt` in a Profile commonly has two states:

| Value | Meaning |
| --- | --- |
| `null` | Use TauriTavern's runtime default Agent system prompt |
| Non-empty string | Fully replace the default system prompt |

If you want the default behavior, keep it as `null`. If you provide a custom prompt, write it as a complete work brief that can stand on its own, not as a partial patch.

At the current stage, Profiles do not switch model or provider for the user. `model.mode` still follows the current prompt snapshot, and `preset` references are mainly for record and validation rather than rewriting context. Preset authors should still remind users to choose suitable API, model, and context settings.

## Distribution Advice

If a preset is adapted for Agent, consider distributing:

- The preset itself.
- The recommended Agent Profile.
- SKILLS paired with that Profile.
- A short note explaining how to use it with Agent Mode off, and which Profile to select when Agent Mode is on.

Do not assume the user already has a Profile or Skill with the same name installed. It is steadier to list dependencies clearly and keep the ordinary preset usable when Agent Mode is off.

## Before Publishing

A small check before publishing helps:

| Check | Expected result |
| --- | --- |
| Agent Mode off | Agent-only blocks do not affect ordinary generation |
| Agent System Prompt | The position exists, has not been removed, and sits where you intend |
| Agent Results | The position matches your intent. If disabled, that is deliberate |
| Profile | `instructions.agentSystemPrompt` is written in the Profile, not in the preset marker |
| SKILLS | Long material is not piled into the system prompt, and Agent can read it as needed |
| Tool policy | Allowed tools match what the system prompt asks Agent to do |

Preset authors do not need to turn Agent into a second complicated system. The best adaptation is often just two clear positions, one well-bounded Profile, and a few readable Skill files.
