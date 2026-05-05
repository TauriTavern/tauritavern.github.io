---
description: Learn how to enable TauriTavern Agent Mode and understand the basic shape of a run.
---

# Agent Quick Start

Agent Mode is a generation mode you can turn on when you need it. When it is off, ordinary SillyTavern generation is not changed, and you do not need to reorganize existing chats to try it.

## Where to Enable It

There are two common entry points:

- Use the Agent button near the chat input area to turn Agent Mode on or off.
- In extension settings, open the `Agent System` section and toggle `Agent Mode On` / `Agent Mode Off`.

Long-press the Agent button near the input area to open the Agent System panel. That panel is where you manage Agent Profiles and SKILLS.

::: tip
If you only want to try Agent Mode, start with the built-in `default-writer` profile. It is a general writing profile suitable for the first usable Agent stage.
:::

## What Changes When It Is On

When Agent Mode is enabled, these actions can enter the Agent path:

| Action | Behavior |
| --- | --- |
| Normal send | Starts an Agent run using the current chat context |
| Regenerate | Starts a new Agent run for the current reply |
| Overswipe to create a new candidate | Uses Agent to generate the new swipe candidate |

These actions stay on the existing path:

| Action | Behavior |
| --- | --- |
| Switching to an existing swipe candidate | Does not start a new Agent run |
| Sending after Agent Mode is turned off | Uses the original SillyTavern generation path |
| Non-Agent extension behavior | Is not changed simply because the Agent panel exists |

## What Happens During a Run

From a user point of view, the flow looks roughly like this:

```text
You send a message
  ↓
TauriTavern captures the context needed for this generation
  ↓
Agent creates a workspace for this run
  ↓
The model sees tools, SKILLS, and workspace roots allowed by the profile
  ↓
Agent may search chat, read world info, read SKILLS, or write drafts
  ↓
Agent submits the output file as a chat message
  ↓
The run ends, and the timeline keeps the process visible
```

This means the final Agent reply is not just a raw piece of text returned by the model. It is submitted from an output file the Agent completed inside its workspace.

## Reading the Timeline

While an Agent run is active, an Agent timeline appears near the input area. It shows what the run is doing.

Common events include:

| Timeline event | Meaning |
| --- | --- |
| Search chat | Agent searches the current chat for relevant history |
| Read chat messages | Agent reads specific messages by index |
| Read world info | Agent reads the world info entries activated for this run |
| List skills | Agent checks which SKILLS are visible |
| Read skill | Agent reads a file from a Skill |
| Write file | Agent writes a draft, output, or note in the workspace |
| Patch file | Agent makes a precise edit to a file |
| Commit reply | Agent submits an output file to the chat |
| Finish task | Agent ends the run |

Click a timeline item to see more detail when detail is available. Not every event contains long text; some events are there to make the run state clear.

## Avoid Sending Again Mid-Run

While an Agent is running, it is best to wait for the current run to finish. Agent needs to preserve workspace state, timeline order, and chat commit order. Triggering several generations at once can make it harder to tell which result you meant to keep.

If the result is not what you wanted, wait for the run to end, then regenerate or adjust the profile and SKILLS before trying again.

## A First Trial

A gentle first test is:

1. Open an existing chat.
2. Make sure the current connection uses a chat-completion model path.
3. Turn on Agent Mode.
4. Send a normal message.
5. Expand the Agent timeline and watch whether it searches, reads, writes, and commits.

If the run fails, start with the error message. Agent currently prefers explicit failure over quietly falling back to ordinary generation. This makes it easier to tell whether the issue is the model, the profile, tool permissions, or a workspace path.

