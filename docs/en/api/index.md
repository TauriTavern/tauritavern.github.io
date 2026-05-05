# API Overview

This section is for stable interfaces exposed by TauriTavern to the frontend, extensions, and external developers.

## Documentation goals

API pages should answer these questions clearly:

- What is the entry point?
- What are the usage constraints?
- What are the return values and error semantics?
- Which behaviors are stable contracts and which are only current implementation details?

## Suggested organization

- `Layout API`: layout, panel, and host UI capabilities
- `Extension API`: host-facing interfaces available to extensions
- `Agent API`: starting Agent runs, subscribing to events, reading workspace files, and managing Agent Profiles
- `Agent Tool Reference`: current built-in tool inputs, outputs, and limits
- `Skill API`: importing, installing, reading, exporting, and deleting local Agent Skills
- Future additions can include `Chat API`, `System API`, and `Storage API`

## Convention

If a capability is part of the public host contract, document it under `window.__TAURITAVERN__.api.*` as the single official entry point instead of treating scattered helpers as formal API.
