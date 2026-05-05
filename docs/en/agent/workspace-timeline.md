---
description: Understand the TauriTavern Agent workspace, output files, commits, and timeline.
---

# Workspace and Timeline

The central idea in Agent Mode is the workspace.

In ordinary generation, the model usually returns text directly. Agent Mode works differently: the Agent first handles files inside a constrained workspace, then submits a chosen output to the chat.

This lets TauriTavern turn generation into a more visible process. What was read, what was written, what was changed, and when the final reply was submitted can all be traced.

## Why a Workspace Exists

The workspace solves four practical problems:

| Problem | What the workspace changes |
| --- | --- |
| Intermediate drafts have nowhere to live | Agent can draft first, then revise into the final reply |
| Tool results pollute chat history | Tool results stay in the run process instead of becoming chat messages |
| Model behavior is hard to understand | The timeline shows key reads, searches, edits, and commits |
| Output is more than body text | Status blocks, summaries, notes, and side material can have stable locations |

This is one of the most important differences between TauriTavern Agent and traditional tool calling: a tool call is a run event, not a chat message.

## What Is in the Workspace

The current Agent Profile can decide which workspace roots are visible and writable. Common roots are:

| Root | Purpose |
| --- | --- |
| `output/` | Final output. The default message body is `output/main.md` |
| `scratch/` | Temporary notes, drafts, and working material |
| `plan/` | Planning files. The directory is reserved, though full Plan Mode runtime is not yet open |
| `summaries/` | Summaries and reusable stage notes |
| `persist/` | Durable information that later runs in the same chat may continue to use |

These paths are logical paths inside the Agent workspace, not system file paths. Agent cannot use `../`, absolute paths, or drive prefixes to reach outside the workspace.

::: warning
`persist/` is best for short, stable information that remains useful later, such as unresolved plot threads, relationship state, or user writing preferences. It is not a good place for complete chat history, model reasoning, or large temporary tool results.
:::

## How Output Enters the Chat

The default output file is:

```text
output/main.md
```

When Agent has finished writing, it calls the commit tool to submit this file as the chat message. The chat shows the final content, while the workspace and timeline retain the process for this run.

This gives two benefits:

- The chat stays clean and only contains the reply the user is meant to read.
- The Agent process remains inspectable for understanding and troubleshooting.

## What the Timeline Shows

The timeline is a user-facing projection of the run journal. It does not expose every internal detail, but it shows the steps that matter to users.

Common timeline items include:

| Item | Meaning |
| --- | --- |
| Read | Reads chat, world info, SKILLS, or workspace files |
| Search | Searches chat or files for relevant snippets |
| Write | Creates or rewrites a workspace file |
| Patch | Makes a precise replacement in an existing file |
| Commit | Submits an output file to the chat |
| Persist | Saves durable workspace changes for later runs in the same chat |
| Done | The Agent run finished normally |
| Failed | A profile, model, tool, or save operation failed |

The timeline is not meant to make you read every low-level detail. It is there so Agent behavior is not a black box.

## What Can Appear in Details

Some events can be expanded. For example:

- Search result snippets.
- Workspace files that were read.
- Tool call results.
- Output content after a write.
- Model responses or error summaries.

Details are read from files associated with the current run. They still follow workspace path restrictions and do not expose system files.

## Cancelled, Failed, and Completed

The timeline distinguishes several states:

| State | Meaning |
| --- | --- |
| Running | Agent is still in a model call or tool loop |
| Completed | Agent submitted successfully and ended |
| Cancelled | The user or system requested cancellation |
| Failed | A non-recoverable error occurred |

Cancellation is not failure. Failure usually means a required condition was not met: the model did not return the required tool-call shape, the profile was invalid, a path was illegal, or the chat commit failed.

TauriTavern tries to show these problems clearly instead of turning them into a reply that only looks normal.

