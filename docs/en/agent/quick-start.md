---
description: Learn how to enable TauriTavern Agent Mode and understand the basic shape of a run.
---

# Agent Quick Start

Agent Mode is a generation mode you can turn on when you need it. When it is off, ordinary SillyTavern generation is unchanged, and you do not need to reorganize existing chats to try it.

## Where to Enable It

There are two common entry points:

- Use the Agent button near the chat input area to turn Agent Mode on or off.
- In extension settings, open the `Agent System` section and toggle `Agent Mode On` / `Agent Mode Off`.

Long-press the Agent button near the input area to open the Agent System panel. That panel is where you manage Agent Profiles, SKILLS, and the Agent currently used for runs.

::: tip
If you only want to try Agent Mode, start with the built-in `default-writer` profile. It is a general writing profile for ordinary creation and chat. If you need more later, copy it and adjust the copy.
:::

## Choose the Current Agent

The Agent System panel has an `Active Profile`. It decides which Profile the next Agent run will use.

Two details are worth keeping in mind:

- The Profile you are editing is not always the Profile that will run. Check `Active Profile` before running.
- Only directly runnable Profiles appear in the `Active Profile` list. A Profile that can only be used as a SubAgent cannot be selected as the main Agent.

If an imported Profile says it requires model configuration, [select a usable local model connection](/en/agent/faq#agent-profile-model-from-api-connection) in that Profile before starting Agent.

## What Changes When It Is On

When Agent Mode is enabled, these actions can enter the Agent path:

| Action | Behavior |
| --- | --- |
| Normal send | Starts an Agent run using the current chat context |
| Regenerate | Starts a new Agent run for the current reply |
| Overswipe to create a new candidate | Uses Agent to generate the new swipe candidate |
| `/trigger` | Starts a normal Agent generation in supported single-character chats |

These actions stay on the existing path:

| Action | Behavior |
| --- | --- |
| Switching to an existing swipe candidate | Does not start a new Agent run |
| Sending after Agent Mode is turned off | Uses the original SillyTavern generation path |
| Non-Agent extension behavior | Is not changed simply because the Agent panel exists |

Agent Mode currently targets single-character chats and the OpenAI/chat-completion path. Group chats, non-chat-completion paths, or prompt snapshots that already contain external tool turns will fail clearly or stay on the original path. They are not silently mixed into Agent runs.

## What Happens During a Run

From a user point of view, the flow looks roughly like this:

```text
You send a message
  ↓
TauriTavern captures the context needed for this generation
  ↓
Agent creates a workspace for this run
  ↓
The model sees the tools, SKILLS, workspace roots, and callable SubAgents allowed by the Profile
  ↓
Agent may search chat, read world info, read SKILLS, write drafts, or delegate focused work to a SubAgent
  ↓
Agent submits the output file as a chat message
  ↓
The run ends, and the timeline keeps the process visible
```

This means the final Agent reply is not just raw text returned by the model. It is submitted from an output file the Agent completed inside its workspace.

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
| Delegate child task | Agent starts a SubAgent for focused work |
| Await child task | Agent waits for one or more SubAgent results |
| Child task returned | A SubAgent returns a summary, findings, or artifact references |
| Write file | Agent writes a draft, output, or note in the workspace |
| Patch file | Agent makes a precise edit to a file |
| Commit reply | Agent submits an output file to the chat |
| Finish task | Agent ends the run |

Click a timeline item to see more detail when detail is available. Not every event contains long text; some events are there to make the run state clear.

## Short Conversational Replies

Agent does not always need to wait until the end and submit one long reply. It can also commit in append mode, so one run can add shorter pieces to the same Agent message.

This fits:

- Casual chat.
- Natural character replies.
- Replies that benefit from a little pacing.
- Cases where one large response would feel too heavy.

The current append behavior still belongs to the same Agent run and the same Agent message. It does not create several independent chat message rows. This keeps the conversational rhythm without breaking run, timeline, and save semantics.

## Avoid Sending Again Mid-Run

While an Agent is running, it is best to wait for the current run to finish. Agent needs to preserve workspace state, timeline order, and chat commit order. Triggering several generations at once can make it harder to tell which result you meant to keep.

If the result is not what you wanted, wait for the run to end, then regenerate or adjust the Profile and SKILLS before trying again.

## A First Trial

A gentle first test is:

1. Open an existing chat.
2. Make sure the current connection uses a chat-completion model path. If you want Agent to use a separate model, first read the [FAQ entry about binding a saved model](/en/agent/faq#agent-profile-model-from-api-connection).
3. Turn on Agent Mode, and make sure `Active Profile` is `default-writer` or another directly runnable Profile.
4. Send a normal message.
5. Expand the Agent timeline and watch whether it searches, reads, writes, and commits.

If the run fails, start with the error message. Agent currently prefers explicit failure over quietly falling back to ordinary generation. This makes it easier to tell whether the issue is the model, the Profile, tool permissions, or a workspace path.
