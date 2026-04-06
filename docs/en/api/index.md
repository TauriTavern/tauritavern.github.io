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
- Future additions can include `Chat API`, `System API`, and `Storage API`

## Convention

If a capability is part of the public host contract, document it under `window.__TAURITAVERN__.api.*` as the single official entry point instead of treating scattered helpers as formal API.
