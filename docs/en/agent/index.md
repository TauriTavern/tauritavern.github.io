---
description: Understand the basic idea, use cases, and reading path for TauriTavern Agent.
---

# Agent Overview

TauriTavern Agent is a creation path alongside the original SillyTavern generation flow.

Traditional generation is closer to one request: the frontend prepares context, the model returns text, and the text enters the chat. If the result does not fit, the usual answer is to regenerate. Agent Mode turns this into a more deliberate writing process: understand the context, consult the material that matters, revise drafts when needed, and submit the finished result to the chat.

It is not meant to replace ordinary generation. Ordinary generation is still best for light, fast, direct conversation. Agent Mode is better for work that needs several steps, reference material, or creator-defined constraints.

## A Simple Definition

In TauriTavern, an Agent run can be understood like this:

> Agent reads, searches, writes, and edits files inside a constrained workspace, then submits the selected output as a chat message when it is done.

The point is not only that the model can call tools. TauriTavern gives this process clear boundaries:

- Intermediate Agent work is written into a workspace, not directly into chat history.
- Reads, searches, writes, edits, delegations, and commits are recorded in the run timeline.
- Creators can use Agent Profiles to limit visible content, available tools, SKILLS, models, and budgets.
- Complex work can be split across callable SubAgents. They run focused background tasks and return results.
- When Agent Mode is off, the original SillyTavern generation path is unchanged.

## When Agent Mode Helps

Agent Mode is a good fit when:

- You want a reply to review longer chat history before it is written.
- You want the model to draft or revise before submitting the final response.
- A character card, preset, or play style needs stable status blocks, side scenes, summaries, or durable memory.
- A creator wants to package tools, instructions, and material for a specific writing task.
- A task can be split into a few independent pieces, such as research, draft review, or style checking.
- You want to see what the model did, not only the final text.

Ordinary generation is still a good fit when:

- You only need a quick one-pass response.
- The current model or API path does not support the tool-calling flow Agent needs.
- The current setup depends on upstream SillyTavern tool calls or streaming event details.
- You want to keep the original SillyTavern behavior exactly as it is.

## What Agent Mode Is Not

To keep expectations clear, the current TauriTavern Agent has firm boundaries:

- It does not let the model operate directly on system files.
- It does not execute scripts from presets, character cards, or SKILLS.
- It does not disguise tool results as chat messages.
- It is not a separate model caller that bypasses existing API settings, secrets, logs, or platform policy.
- It is not an unlimited background queue for many Agents. Delegation is still limited by Profile settings and run budgets.
- It is not a global behavior that must always be enabled.

::: tip Clear failure is intentional
If an Agent configuration is incomplete, asks for a hidden tool, or tries to access a path outside the workspace, TauriTavern will stop the run or return a readable error. This avoids a worse outcome: appearing to work while silently taking a different path.
:::

## How to Read These Pages

If you only want to use Agent Mode:

1. Start with [Quick Start](/en/agent/quick-start).
2. Read [Workspace and Timeline](/en/agent/workspace-timeline) to understand the events shown during a run.
3. If you see child task or delegation events, read [SubAgent](/en/agent/subagents).
4. Check [Current Capabilities and Boundaries](/en/agent/current-limits) when something is unclear.

If you create presets, character cards, or play styles:

1. Start with [Agent Profiles](/en/agent/profiles).
2. If you want to split work into child tasks, read [SubAgent](/en/agent/subagents).
3. Then read [SKILLS](/en/agent/skills).
4. Read [Creator Adaptation Guide](/en/agent/creator-guide) to package instructions, material, and limits in a stable way.
5. If you mainly maintain presets, continue with [Preset Author Guide](/en/agent/preset-authors).
6. If you maintain extensions or automation panels, continue with [Extension Author Guide](/en/agent/extension-authors).
7. If you make themes or custom CSS, continue with [Theme Styling Author Guide](/en/agent/theme-authors).

## Relationship to the Rest of the Docs

The Agent section is written for users and creators. It focuses on how to use Agent Mode, how to adapt content for it, and where the current boundaries are.

If you need host-facing interfaces or ABI details, see the [API documentation](/en/api/). If you want to understand the larger engineering structure of TauriTavern, start with [Architecture Overview](/en/architecture/overview).

For more detailed Agent references, you can also read:

- [Agent System Architecture](/en/architecture/agent): workspaces, timeline, tool loop, and commit boundaries.
- [Agent API](/en/api/agent): startup, subscription, cancellation, workspace reads, and Profile management.
- [Agent Tool Reference](/en/api/agent-tools): current built-in tool inputs and outputs.
- [Skill API](/en/api/skill): importing, installing, reading, exporting, and deleting SKILLS.
