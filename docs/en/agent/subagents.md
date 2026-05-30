---
description: Understand SubAgents, task delegation, and child task results in TauriTavern.
---

# SubAgent

A SubAgent is a background Agent called by another Agent. It does not take over the chat or submit foreground replies on its own. It receives a clear child task, works inside a constrained workspace, and returns a summary, findings, or artifact references to the parent Agent.

Think of it as asking a focused helper to handle one part of the job. The parent Agent still decides what to do with the result and remains responsible for the final chat commit.

## When It Helps

SubAgents are useful when a task can be split into clear pieces:

- Collecting relevant clues from a long chat.
- Checking whether a draft matches a character, format, or rule.
- Preparing a summary, outline, or candidate answer for the main Agent.
- Working on a few independent questions in parallel.
- Using a different model or preset for a focused task.

Do not use a SubAgent just to make a simple reply. Delegation adds another model run and more timeline detail. If the main Agent can handle the task cleanly, that is usually the better path.

## How It Works

A delegated task usually follows this flow:

```text
The main Agent sees a callable SubAgent
  ↓
The main Agent starts a child task with agent.delegate
  ↓
The SubAgent creates its own invocation and task workspace in the background
  ↓
The SubAgent reads the task brief, relevant summaries, and allowed files
  ↓
The SubAgent returns its result with task.return
  ↓
The main Agent waits for or checks the result with agent.await
  ↓
The main Agent decides how to use the result and submits the final chat content
```

The timeline shows delegation, waiting, child task start, return, failure, and cancellation events. A child task's intermediate work is not written as normal chat messages.

## Related Tools

SubAgent work uses four tools:

| Tool | Used by | Purpose |
| --- | --- | --- |
| `agent.list` | Parent Agent | Lists Agents that can be called |
| `agent.delegate` | Parent Agent | Starts a child task for a selected Agent |
| `agent.await` | Parent Agent | Waits for child tasks or checks their status |
| `task.return` | SubAgent | Returns the task result and ends the child task |

`task.return` only appears while a child task is running. It should not be added manually to an ordinary main Agent Profile.

## Configure a Callable SubAgent

A callable SubAgent Profile usually needs these settings:

| Setting | Recommendation |
| --- | --- |
| Allow as SubAgent | On |
| Model binding | [Choose a runnable model](/en/agent/faq#agent-profile-model-from-api-connection); do not leave it at `requires configuration` |
| Tool permissions | Open read, write, Skill, or world info tools only as needed |
| System prompt | Say what this SubAgent is good at, what it should return, and what it should avoid |

If any main Agent may call it, allowed callers can be `*`. If it is meant to serve one main Profile, allow only that Profile.

## What the Main Agent Needs

A main Agent that delegates tasks needs:

- A Profile that allows creating child Agents.
- Enough max rounds and tool-call budget.
- System instructions that say when to delegate and when to do the work directly.

More delegation is not automatically better. A good main Agent should delegate only when the task can be split clearly and the SubAgent result will help the final reply.

## Writing a Good Child Task

A good child task describes the result, not only the steps.

Include:

- Objective: what needs to be done.
- Context: relevant characters, snippets, file paths, or limits.
- Expected output: summary, check result, draft, or structured findings.
- Budget awareness: if a short answer is enough, do not ask for a long analysis.

Do not make the SubAgent guess the parent Agent's intent. The parent Agent should provide the background it needs.

## Workspace and Results

A SubAgent sees a restricted task workspace. Common paths include:

| Path | Meaning |
| --- | --- |
| `summaries/parent/` | Read-only summaries provided by the parent Agent |
| `summaries/agents/` | Summaries returned by other child tasks |
| `summaries/` | Writable summary area for the current child task |
| `scratch/` | Temporary notes for the current child task |

The SubAgent can return artifacts. The parent Agent sees those references and decides whether to read, use, or ignore them. The final chat content is still submitted by the parent Agent.

## Concurrency and Budgets

Delegation is limited by Profile settings:

- Maximum concurrent child tasks controls how many SubAgents can run at the same time.
- Maximum child tasks per run controls how many child tasks can be started in one run.
- Each child task can receive a smaller max-round or max-tool-call budget.
- Child task results have a budget. Very long results should not be returned directly to the parent Agent.

If tasks often time out or return no useful result, narrow the task brief before raising budgets.

## Current Boundaries

Return-mode SubAgents are available today, with clear limits:

- There is no user-facing `agent.handoff` yet.
- There is no model-visible child task cancellation tool yet.
- A SubAgent cannot directly submit chat messages.
- A failed child task does not automatically make the parent Agent succeed; the parent Agent must decide what to do next.
- Group-chat Agent runs are not open as a stable feature yet.

These limits keep final responsibility with the parent Agent. SubAgents should support the main flow, not turn it into an uncontrolled background process.

## Common Questions

**Why can't I see a SubAgent?**  
The target Profile usually has not enabled `Allow as SubAgent`, or it restricts allowed callers.

**Why does delegation say the model needs configuration?**  
Imported or shared Profiles do not include local model connections. Open that Profile and [select a runnable model](/en/agent/faq#agent-profile-model-from-api-connection), then run again.

**Why did the SubAgent finish without posting a chat reply?**  
That is expected. A SubAgent returns its result to the parent Agent. The parent Agent decides the final chat content.

**When should I avoid SubAgents?**  
If a task can be finished clearly in one normal Agent run, do not split it. One less delegation step usually means one less source of uncertainty.
