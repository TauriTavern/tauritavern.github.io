---
description: Understand the purpose, structure, import/export flow, and safety boundaries of TauriTavern Agent SKILLS.
---

# SKILLS

SKILLS are local knowledge packages that Agent can read when needed.

They are suitable for writing methods, character guidance, formatting requirements, world references, style examples, and task instructions. Compared with placing large blocks of text directly into prompts, SKILLS are easier to maintain over time and let Agent read specific files only when they matter.

## What SKILLS Are Not

To keep the boundary clear, current SKILLS have several important limits:

- SKILLS are not executable plugins.
- SKILLS are not automatically injected into the prompt in full.
- SKILLS cannot grant tool permissions.
- SKILLS cannot automatically install MCP servers.
- Agent cannot install, replace, or edit installed SKILLS during a run.

If a Skill contains `scripts/`, TauriTavern keeps the files and shows the risk, but does not execute those scripts today.

## What Belongs in SKILLS

Good candidates:

- Writing steps for a specific genre or format.
- Character voice, relationship pacing, and boundaries.
- Status block or side-scene format requirements.
- Complex lore split into readable sections.
- Reusable checklists.
- A small number of strong examples.

Poor candidates:

- State that changes every turn.
- Complete chat history.
- Secrets, accounts, or private paths.
- Core instructions that the model must obey every time without question.
- Logic that only works by running code.

## Basic Structure

A Skill is a directory. The central file is `SKILL.md`:

```text
my-skill/
  SKILL.md
  references/
  examples/
  assets/
  scripts/
  agents/tauritavern.json
```

Current requirements:

- `SKILL.md` must exist.
- `SKILL.md` must begin with YAML frontmatter.
- The frontmatter must include `name` and `description`.
- `name` should use lowercase letters, digits, `-`, or `_`.
- `agents/tauritavern.json` is optional. If it exists but is invalid, import will fail.

A small example:

```md
---
name: gentle-romance-style
description: Guidance for delicate, slow-burn emotional writing with attention to inner change.
---

# Gentle Romance Style

This Skill helps Agent handle slow-burn relationship development.

## When to Use

- The relationship needs to warm naturally.
- The reply needs more psychological texture.
- The user wants fewer abrupt emotional leaps.

## Writing Tendency

- Prefer actions and details before direct emotional summaries.
- Let characters express change through choices, pauses, and avoidance.
- Avoid replacing interaction with explanatory monologue.
```

## Import and Installation

Use the `SKILLS` tab in the Agent System panel to import a Skill archive.

The usual flow is:

1. Choose a `.ttskill` or compatible zip archive.
2. Preview Skill information, file count, size, and warnings.
3. Install it if there is no conflict.
4. If the same name exists with different content, choose skip or replace.

A Skill with the same name and the same content is recognized as already installed. A same-name Skill with different content is not automatically renamed; the user must choose what to do.

## View, Export, and Delete

After installation, the `SKILLS` tab shows the Skill file tree.

- Text files can be opened for preview.
- Binary files are shown as files but not displayed as ordinary text.
- A Skill can be exported as `.ttskill` for sharing or backup.
- When the user explicitly deletes a Skill, TauriTavern removes the local installed record and directory.

## How Agent Reads SKILLS

Agent does not read an entire Skill by default. It usually:

1. Uses `skill.list` to see which SKILLS are allowed by the current profile.
2. Uses `skill.search` to find relevant snippets inside a Skill.
3. Uses `skill.read` to read `SKILL.md` or a specific file range.

Reads are constrained by the Agent Profile:

- Hidden SKILLS do not appear in the list.
- Denied SKILLS cannot be read, even if installed.
- Each read and each run have character budgets.
- Only UTF-8 text files can be read.

This on-demand approach keeps Skill packages maintainable and avoids placing every reference into context at once.

## Advice for Creators

A useful Skill does not need to be large. It should quickly tell Agent three things:

- When to use it.
- Which files to read first.
- What boundaries matter while using it.

Suggestions:

- State the use case near the top of `SKILL.md`.
- Put longer references in `references/`.
- Put a few examples in `examples/`.
- Use clear filenames, such as `status-bar-format.md` or `relationship-pacing.md`.
- Avoid packing several unrelated play styles into one Skill.

If a Skill is meant to work with a specific Agent Profile, say so in the Skill description instead of assuming every user has enabled every tool.

