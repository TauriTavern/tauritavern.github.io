---
description: A styling guide for TauriTavern theme and custom CSS authors adapting the Agent frontend.
---

# Theme Styling Author Guide

This page is for authors who make TauriTavern themes, global CSS, character-card styling, or preset companion skins.

The Agent system adds several frontend surfaces: the Agent toggle in the send bar, the run timeline, the Agent system panel, the embedded assets popup, and the SKILLS file viewer. These surfaces inherit the existing SillyTavern / TauriTavern theme variables by default. If a theme already handles body text, borders, surfaces, quote color, and blur strength well, the Agent UI will usually fit in without special work.

Still, Agent has a few new states and information layers. If you want to tune them more closely, the variables and class names below are the safest places to start.

[[toc]]

## Start With the Boundary

Agent frontend styling is not meant to create a separate visual system. It adds a clear set of controls and process views on top of the existing theme.

The styling follows a few practical rules:

- Keep using the existing `SmartTheme` variables for base colors and text.
- Use the `ttas-` prefix for Agent-specific styles.
- Prefer CSS variables as the main customization surface, so authors do not have to depend on deep DOM structure.

Theme adaptation usually works best in these layers:

| Layer | Recommendation | Notes |
| --- | --- | --- |
| Override CSS variables | Recommended | The most stable path, and the easiest to keep compatible with later UI changes |
| Use semantic class names | Fine when needed | Good for a specific area, such as timeline items, file preview, or tool rows |
| Depend on deep structure | Use carefully | DOM nesting can change as features evolve, so it is a poor long-term foundation |

::: tip
If you only want the Agent UI to better match a theme, start by overriding variables on `.ttas-root` and `#ttas_agent_run_timeline`. Reach for more specific selectors only when variables cannot express the design you need.
:::

## Inherited Theme Variables

Agent styles read these common theme variables:

| Variable | How Agent uses it |
| --- | --- |
| `--SmartThemeBodyColor` | Main text, icons, and mixed detail text |
| `--SmartThemeBorderColor` | Panel borders, separators, and button outlines |
| `--SmartThemeBlurTintColor` | Panel surfaces, popup surfaces, and translucent backgrounds |
| `--SmartThemeQuoteColor` | Default accent color, running state, and selected state |
| `--SmartThemeEmColor` | Default source for reasoning-style detail color |
| `--SmartThemeBlurStrength` | Backdrop blur strength for panels, popups, and the timeline |

This means many themes do not need Agent-specific CSS. If the base variables are balanced, the default Agent styling follows the theme naturally.

When you are building a full theme, it is usually worth checking these base variables before adding dedicated `ttas-` overrides. That keeps maintenance lighter and helps Agent, extension panels, and the original SillyTavern UI feel like one interface.

## Common Variables

The Agent system panel, embedded assets popup, SKILLS file viewer, and related areas use `.ttas-root` as their root scope. It is the best place for broad visual tuning.

```css
.ttas-root {
  --ttas-accent: var(--SmartThemeQuoteColor);
  --ttas-border: color-mix(in srgb, var(--SmartThemeBorderColor) 82%, var(--SmartThemeBodyColor) 18%);
  --ttas-border-soft: color-mix(in srgb, var(--SmartThemeBorderColor) 72%, transparent);
  --ttas-surface: color-mix(in srgb, var(--SmartThemeBlurTintColor) 86%, transparent);
  --ttas-surface-soft: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, var(--black20a));
  --ttas-surface-strong: color-mix(in srgb, var(--SmartThemeBodyColor) 9%, var(--black30a));
  --ttas-surface-raised: color-mix(in srgb, var(--SmartThemeBlurTintColor) 78%, var(--SmartThemeBodyColor) 6%);
  --ttas-radius: 8px;
  --ttas-radius-sm: 6px;
  --ttas-shadow: 0 20px 64px color-mix(in srgb, var(--black70a) 82%, transparent);
}
```

Common tuning points:

| Variable | Good for |
| --- | --- |
| `--ttas-accent` | Main Agent accent across panels, buttons, icons, and the timeline |
| `--ttas-border` | Primary border clarity |
| `--ttas-border-soft` | Secondary separators and card borders |
| `--ttas-surface` | Large panel surface |
| `--ttas-surface-soft` | Light blocks, code blocks, and input areas |
| `--ttas-surface-strong` | Hover, selected, and stronger layered backgrounds |
| `--ttas-surface-raised` | Raised sections inside a panel |
| `--ttas-radius` | Main radius |
| `--ttas-radius-sm` | Small buttons, list rows, and input radius |
| `--ttas-shadow` | Agent dialog shadow |

Example: make Agent panels flatter and less glassy.

```css
.ttas-root {
  --ttas-surface: color-mix(in srgb, var(--SmartThemeBlurTintColor) 96%, transparent);
  --ttas-surface-raised: color-mix(in srgb, var(--SmartThemeBlurTintColor) 92%, var(--SmartThemeBodyColor) 3%);
  --ttas-shadow: 0 12px 32px rgb(0 0 0 / 0.28);
}
```

## Send Bar Agent Toggle

The Agent toggle in the send bar uses:

```text
.ttas-agent-send-toggle
.ttas-agent-send-toggle-icon
.ttas-agent-send-toggle-status
```

Common states:

| Selector | Meaning |
| --- | --- |
| `.ttas-agent-send-toggle` | Base Agent toggle |
| `.ttas-agent-send-toggle.active` | Agent Mode is enabled |
| `.ttas-agent-send-toggle.running` | An Agent run is currently active |
| `.ttas-agent-send-toggle-status` | The small status dot in the lower corner |

It uses `--ttas-agent-state-color` for the current state color. By default the off state is muted, while the enabled state is close to `--ttas-accent`.

Example: make the enabled state easier to notice without changing button size.

```css
.ttas-agent-send-toggle.active {
  --ttas-agent-state-color: #68d8b4;
}

.ttas-agent-send-toggle.active::before {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.12),
    0 0 16px color-mix(in srgb, var(--ttas-agent-state-color) 42%, transparent);
}
```

Avoid changing its `width`, `height`, `order`, or `display` directly. Those properties are tied to the send bar layout and generation-state hiding logic. If you only want a different visual weight, change color, border, shadow, or opacity first.

## Run Timeline

The run timeline is the most important new Agent surface. It is mounted above the send form, with this root node:

```text
#ttas_agent_run_timeline
```

The outer mount point is:

```text
.ttas-run-timeline-mount
```

The timeline changes classes and data attributes as the run state changes:

| Selector | Meaning |
| --- | --- |
| `#ttas_agent_run_timeline.is-collapsed` | Timeline is collapsed |
| `#ttas_agent_run_timeline.is-running` | The current run is active |
| `#ttas_agent_run_timeline.is-details-open` | Details view is open |
| `#ttas_agent_run_timeline.is-error` | The current run failed |
| `#ttas_agent_run_timeline[data-ttas-status="idle"]` | No current run |
| `#ttas_agent_run_timeline[data-ttas-status="ready"]` | A run can be viewed, but is not active |
| `#ttas_agent_run_timeline[data-ttas-status="running"]` | A run is active |
| `#ttas_agent_run_timeline[data-ttas-status="completed"]` | Run completed |
| `#ttas_agent_run_timeline[data-ttas-status="failed"]` | Run failed |
| `#ttas_agent_run_timeline[data-ttas-status="cancelled"]` | Run was cancelled |
| `#ttas_agent_run_timeline[data-ttas-view="collapsed"]` | Collapsed view |
| `#ttas_agent_run_timeline[data-ttas-view="events"]` | Event list view |
| `#ttas_agent_run_timeline[data-ttas-view="details"]` | Details view |

### Timeline Variables

The timeline has its own variables so run-state colors do not spill into the whole Agent panel.

| Variable | Use |
| --- | --- |
| `--ttas-run-panel-bg` | Timeline panel background |
| `--ttas-run-panel-bg-strong` | Timeline header and sticky detail header background |
| `--ttas-run-panel-border` | Main timeline border |
| `--ttas-run-panel-border-soft` | Internal timeline separators |
| `--ttas-run-panel-accent` | Timeline accent color |
| `--ttas-run-line-bg` | Normal event row background |
| `--ttas-run-line-bg-active` | Latest event row background |
| `--ttas-run-line-text-muted` | Secondary text |
| `--ttas-run-tone-read` | Read, search, and list events |
| `--ttas-run-tone-write` | Write and patch events |
| `--ttas-run-tone-commit` | Commit and persist events |
| `--ttas-run-tone-success` | Success state |
| `--ttas-run-tone-warn` | Warning state |
| `--ttas-run-tone-error` | Error state |

Example: give the timeline a quieter dark treatment.

```css
#ttas_agent_run_timeline {
  --ttas-run-panel-bg: rgb(20 22 26 / 0.82);
  --ttas-run-panel-bg-strong: rgb(24 27 32 / 0.94);
  --ttas-run-panel-border: rgb(180 190 210 / 0.18);
  --ttas-run-panel-border-soft: rgb(180 190 210 / 0.12);
  --ttas-run-panel-accent: #9fc7ff;
  --ttas-run-line-bg: rgb(255 255 255 / 0.045);
  --ttas-run-line-bg-active: rgb(159 199 255 / 0.12);
}
```

### Timeline Items

Each event row uses:

```text
.ttas-run-event
.ttas-run-event-icon
.ttas-run-event-copy
.ttas-run-event-title
.ttas-run-event-meta
```

Events carry kind classes and semantic attributes:

| Selector | Meaning |
| --- | --- |
| `.ttas-run-event.kind-read` | Reads from files, chat, SKILLS, and similar sources |
| `.ttas-run-event.kind-search` | Searches chat or files |
| `.ttas-run-event.kind-list` | Lists resources |
| `.ttas-run-event.kind-write` | Writes a file |
| `.ttas-run-event.kind-patch` | Applies a patch |
| `.ttas-run-event.kind-commit` | Commits to chat |
| `.ttas-run-event.kind-persist` | Saves durable workspace changes |
| `.ttas-run-event.tone-info` | Informational state |
| `.ttas-run-event.tone-active` | Active step |
| `.ttas-run-event.tone-success` | Success |
| `.ttas-run-event.tone-warn` | Warning |
| `.ttas-run-event.tone-error` | Error |
| `.ttas-run-event.is-latest` | Latest item in the current list |
| `.ttas-run-event.is-active` | Latest item that is still in progress |
| `.ttas-run-event.is-selected` | Selected item in details view |
| `.ttas-run-event[data-ttas-kind="read"]` | Event kind data attribute, useful for more precise styling |

Example: separate read, write, and commit events.

```css
#ttas_agent_run_timeline {
  --ttas-run-tone-read: #8eb6ff;
  --ttas-run-tone-write: #82d497;
  --ttas-run-tone-commit: #dcc56f;
}

.ttas-run-event.kind-commit button {
  border-color: color-mix(in srgb, var(--ttas-run-tone-commit) 38%, transparent);
}
```

## Details, Reasoning, and Diff

The timeline details view can show event details such as read files, write results, model response summaries, errors, and diffs.

Main class names:

```text
.ttas-run-detail-head
.ttas-run-detail-nav
.ttas-run-detail-scroll
.ttas-run-detail-section
.ttas-run-detail-block
.ttas-run-detail-block-head
.ttas-run-diff
.ttas-run-diff-row
.ttas-run-diff-gutter
.ttas-run-diff-marker
.ttas-run-diff-code
```

Detail blocks carry data attributes:

| Selector | Meaning |
| --- | --- |
| `.ttas-run-detail-block[data-ttas-block-kind="text"]` | Plain text |
| `.ttas-run-detail-block[data-ttas-block-kind="json"]` | JSON or structured content |
| `.ttas-run-detail-block[data-ttas-block-kind="reasoning"]` | Reasoning-style content |
| `.ttas-run-detail-block[data-ttas-block-kind="diff"]` | Diff content |
| `.ttas-run-diff-row[data-ttas-diff-row="add"]` | Added row |
| `.ttas-run-diff-row[data-ttas-diff-row="delete"]` | Deleted row |
| `.ttas-run-diff-row[data-ttas-diff-row="context"]` | Context row |

Useful variables:

| Variable | Use |
| --- | --- |
| `--ttas-run-reasoning-color` | Reasoning text and border color |
| `--ttas-run-reasoning-bg` | Reasoning background |
| `--ttas-run-reasoning-border` | Reasoning left border |
| `--ttas-run-detail-block-bg` | Closed or normal detail block background |
| `--ttas-run-detail-block-bg-open` | Open detail block background |
| `--ttas-run-diff-add-color` | Added diff row text |
| `--ttas-run-diff-add-bg` | Added diff row background |
| `--ttas-run-diff-delete-color` | Deleted diff row text |
| `--ttas-run-diff-delete-bg` | Deleted diff row background |
| `--ttas-run-diff-context-bg` | Context diff row background |
| `--ttas-run-diff-gutter-color` | Diff line number color |

Example: improve diff readability in a dark theme.

```css
#ttas_agent_run_timeline {
  --ttas-run-diff-add-color: #8ee6a1;
  --ttas-run-diff-add-bg: rgb(70 190 105 / 0.18);
  --ttas-run-diff-delete-color: #ff9b93;
  --ttas-run-diff-delete-bg: rgb(230 88 82 / 0.16);
  --ttas-run-diff-context-bg: rgb(255 255 255 / 0.035);
  --ttas-run-diff-gutter-color: rgb(220 225 235 / 0.42);
}
```

## Agent System Panel

The Agent system panel manages Profiles and SKILLS. Its root node is:

```text
.ttas-panel-root
```

Common areas:

| Class name | Area |
| --- | --- |
| `.ttas-titlebar` | Panel title bar |
| `.ttas-panel-body` | Panel body |
| `.ttas-tabs` | Profiles / SKILLS tabs |
| `.ttas-profile-layout` | Profile editing layout |
| `.ttas-list` | Left-side list |
| `.ttas-side-list` | Desktop side list |
| `.ttas-mobile-select` | Mobile selector |
| `.ttas-editor-hero` | Profile summary area |
| `.ttas-stat-grid` | Profile stat cards |
| `.ttas-section` | Standard section |
| `.ttas-form-grid` | Form grid |
| `.ttas-field` | Single form field |
| `.ttas-json` | JSON editor or preview block |
| `.ttas-toolbar` | Action button area |

The Profile tool matrix has a more specific set of class names:

| Class name | Area |
| --- | --- |
| `.ttas-tool-workbench` | Whole tool workbench layout |
| `.ttas-tool-groups` | Tool group container |
| `.ttas-tool-group` | Single tool group |
| `.ttas-tool-row` | Single tool row |
| `.ttas-tool-row.enabled` | Tool is enabled |
| `.ttas-tool-row.active` | Currently selected tool |
| `.ttas-tool-row.customized` | Tool description has been customized |
| `.ttas-tool-editor-panel` | Tool description editor panel |
| `.ttas-tool-badge-custom` | Customized description badge |
| `.ttas-tool-badge-write` | Write-tool badge |
| `.ttas-tool-badge-disabled` | Disabled tool badge |

Example: make enabled tools clearer.

```css
.ttas-tool-row.enabled {
  border-color: color-mix(in srgb, var(--ttas-accent) 48%, var(--ttas-border));
  background-color: color-mix(in srgb, var(--ttas-accent) 14%, var(--SmartThemeBlurTintColor));
}

.ttas-tool-row.enabled .ttas-tool-select strong {
  color: color-mix(in srgb, var(--ttas-accent) 72%, var(--SmartThemeBodyColor));
}
```

## SKILLS and File Preview

The SKILLS management page and file viewer mainly use:

| Class name | Area |
| --- | --- |
| `.ttas-skill-pane` | Skill detail panel |
| `.ttas-skill-hero` | Current Skill summary |
| `.ttas-skill-meta` | Skill name, description, and tags |
| `.ttas-tags` | Tag list |
| `.ttas-files-section` | Skill files area |
| `.ttas-file-viewport` | File tree scroll area |
| `.ttas-file-tree` | File tree |
| `.ttas-file-tree-root` | File tree root |
| `.ttas-file-row` | File or folder row |
| `.ttas-file-dialog` | File preview dialog |
| `.ttas-file-viewer` | File preview body |
| `.ttas-file-content` | File text content |

Skill files are often long text files. Keep line height, contrast, and scrolling comfortable. It is fine to change the font, but avoid making `.ttas-file-content` non-scrollable or so short that ordinary files become hard to read.

Example: make file preview feel closer to a code reader.

```css
.ttas-file-content {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88rem;
  line-height: 1.6;
  background-color: color-mix(in srgb, var(--SmartThemeBlurTintColor) 88%, black 8%);
}
```

## Embedded Assets Popup

Presets and character cards can embed Agent Profiles and SKILLS. The related popup uses:

| Class name | Area |
| --- | --- |
| `.ttas-embed-dialog` | Outer embedded assets dialog |
| `.ttas-embed-panel` | Popup body |
| `.ttas-embed-titlebar` | Title bar |
| `.ttas-embed-body` | Popup content |
| `.ttas-embed-target` | Current target information |
| `.ttas-embed-card` | Single action block |
| `.ttas-embed-action-row` | Selector and button row |
| `.ttas-embedded-list` | Embedded item list |
| `.ttas-embedded-item` | Single embedded item |

This popup usually appears inside preset or character-card management flows. It should feel consistent with the surrounding management UI, and usually does not need a strong Agent-branded treatment.

## Mobile Notes

On mobile, TauriTavern handles safe areas, keyboard lift, and overlay geometry. Agent panels also read these host variables:

```text
--tt-inset-top
--tt-inset-right
--tt-inset-bottom
--tt-inset-left
--tt-viewport-bottom-inset
--tt-base-viewport-height
```

Theme authors usually do not need to override them directly. They are part of the host layout contract and help keep the top safe area, bottom gesture area, and software keyboard from covering the UI.

::: warning
Avoid forcing core geometry properties on Agent dialogs, the timeline, or the main interface from a theme. This includes properties such as `position`, `inset`, `top`, `bottom`, `height`, `max-height`, and `pointer-events`. They are often tied to mobile safe areas, the input area, collapsed state, or details view.
:::

If you need mobile adaptation, prefer media queries that tune visual details instead of rewriting the geometry system:

```css
@media (max-width: 600px) {
  #ttas_agent_run_timeline {
    --ttas-run-panel-accent: #8bd7ff;
    --ttas-run-line-text-muted: color-mix(in srgb, var(--SmartThemeBodyColor) 58%, transparent);
  }

  .ttas-run-event-title {
    font-size: 0.8rem;
  }
}
```

## Motion and Accessibility

The Agent UI has a few light animations: the send-bar running state, the active point in the timeline, and detail reveal. The default stylesheet already handles `prefers-reduced-motion: reduce`.

You can adjust animation strength, but it is best to keep the reduced-motion fallback:

```css
@media (prefers-reduced-motion: reduce) {
  .ttas-agent-send-toggle,
  #ttas_agent_run_timeline,
  .ttas-root * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Clear focus styles are also worth keeping. The Agent panel has many buttons, list rows, and collapsible detail blocks. Keyboard users need to see where focus is.

## What to Avoid

These patterns may work in a screenshot, but tend to cause maintenance trouble:

- Avoid broad global selectors that rewrite every `.menu_button` and remove size or state differences from Agent panel buttons.
- Avoid setting `.ttas-agent-send-toggle` or `#ttas_agent_run_timeline` to `display: none` unless your theme clearly states that it hides the Agent entry point or timeline.
- Avoid relying on deep structural selectors such as `.ttas-panel-root > div > section > div`.
- Avoid forcing the timeline to a very large fixed height. It has to share space with the chat input, mobile keyboard, and details view.
- Avoid removing the clickable area from `.ttas-run-resize-handle`, or users will lose the ability to resize the timeline.
- Avoid making added and deleted diff rows so color-dependent that they become unreadable. Keep enough brightness contrast as well.
- Avoid setting text areas, file previews, or detail blocks to `overflow: hidden`; long content will be clipped.

## Pre-Release Check

Before publishing a theme with Agent adaptation, it is worth checking these states:

| Check | Confirm |
| --- | --- |
| Agent Mode off | The ordinary send bar layout is not affected |
| Agent Mode on | The Agent toggle is visible and the active state is clear |
| Running | The collapsed timeline, running animation, and latest event remain readable |
| Completed | The completed state is not mistaken for an active run |
| Failed state | Failed / error colors are noticeable without being harsh |
| Details view | Text blocks, JSON, reasoning, and diff can all be scrolled and read |
| Profile panel | Forms, tool matrix, and JSON areas do not overflow |
| SKILLS panel | File tree and file preview remain usable with long filenames |
| Light theme | Borders, backgrounds, and secondary text have enough contrast |
| Dark theme | Diff, error, warning, and commit states do not blend together |
| Small screens | Timeline does not cover the input, and dialogs stay inside the viewport |

The Agent interface will keep growing as the feature grows. A steady theme adaptation usually starts with variables for the overall feel, then adds light selector work only where a specific area needs it. That keeps the theme expressive while leaving room for future Agent panels to evolve.
