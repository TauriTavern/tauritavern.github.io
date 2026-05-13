---
description: Understand the philosophy, use cases, and reading path for TauriTavern Agent.
---

# Agent Overview

The TauriTavern Agent system is a new creation path alongside the original SillyTavern generation flow.

Traditional generation is closer to a single request: the frontend prepares context, the model returns a piece of text, and that text enters the chat. If the result does not feel right, the usual answer is to regenerate. Agent Mode changes this into something closer to a writing process: understand the context, consult the material that matters, revise the draft when needed, and then submit the finished result to the chat.

It is not meant to replace ordinary generation. Ordinary generation remains the right fit for light, quick, direct conversation. Agent Mode is better suited to work that benefits from multiple steps, reference material, and creator-defined constraints.

## A Simple Definition

In TauriTavern, an Agent run can be understood like this:

> The Agent reads, searches, writes, and edits files inside a constrained workspace, then submits the chosen output as a chat message when it is done.

The important point is not merely that the model can call tools. TauriTavern gives the process a clear boundary:

- Intermediate Agent work is written into a workspace, not directly into chat history.
- Reads, searches, writes, edits, and commits are recorded in the run timeline.
- Creators can use Agent Profiles to constrain visible content, available tools, SKILLS, and budgets.
- When Agent Mode is off, the original SillyTavern generation path remains unchanged.

## When Agent Mode Helps

Agent Mode is a good fit when:

- You want the reply to look back through longer chat history before it is written.
- You want the model to draft and revise before submitting the final response.
- A character card, preset, or play style needs stable status blocks, side scenes, summaries, or durable memory.
- A creator wants to package tools, instructions, and material for a specific writing task.
- You want to see what the model actually did, rather than only seeing the final text.

Ordinary generation is still a good fit when:

- You only need a quick one-pass response.
- The current model or API path does not support the tool-calling flow Agent needs.
- The current setup depends on upstream SillyTavern tool calls or streaming event details.
- You want to keep the original SillyTavern behavior exactly as it is.

## What Agent Mode Is Not

To keep expectations clear, the current TauriTavern Agent also has firm boundaries:

- It does not let the model operate directly on system files.
- It does not execute scripts from presets, character cards, or SKILLS.
- It does not disguise tool results as chat messages.
- It is not a separate model caller that bypasses existing API settings, secrets, logs, or platform policy.
- It is not a global behavior that must always be enabled.

::: tip Clear failure is intentional
If an Agent Profile is incomplete, requests a hidden tool, or tries to access a path outside the workspace, TauriTavern will stop the run or return an explicit error. This avoids the quiet kind of failure where the system appears to work while actually taking a different path.
:::

## How to Read These Pages

If you only want to use Agent Mode:

1. Start with [Quick Start](/en/agent/quick-start).
2. Read [Workspace and Timeline](/en/agent/workspace-timeline) to understand the events shown during a run.
3. Check [Current Capabilities and Boundaries](/en/agent/current-limits) when something is unclear.

If you create presets, character cards, or play styles:

1. Start with [Agent Profiles](/en/agent/profiles).
2. Then read [SKILLS](/en/agent/skills).
3. Read [Creator Adaptation Guide](/en/agent/creator-guide) to package instructions, material, and limits in a stable way.
4. If you mainly maintain presets, continue with [Preset Author Guide](/en/agent/preset-authors).
5. If you maintain extensions or automation panels, continue with [Extension Author Guide](/en/agent/extension-authors).
6. If you make themes or custom CSS, continue with [Theme Styling Author Guide](/en/agent/theme-authors).

## Relationship to the Rest of the Docs

The Agent section is written for users and creators. It focuses on how to use Agent Mode, how to adapt content for it, and where the current boundaries are.

If you need host-facing interfaces or ABI details, see the [API documentation](/en/api/). If you want to understand the larger engineering structure of TauriTavern, start with [Architecture Overview](/en/architecture/overview).

For more detailed Agent references, you can also read:

- [Agent System Architecture](/en/architecture/agent): workspaces, timeline, tool loop, and commit boundaries.
- [Agent API](/en/api/agent): startup, subscription, cancellation, workspace reads, and Profile management.
- [Agent Tool Reference](/en/api/agent-tools): current built-in tool inputs and outputs.
- [Skill API](/en/api/skill): importing, installing, reading, exporting, and deleting SKILLS.
