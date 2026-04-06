# Backend Layers

The Rust backend in TauriTavern is not a line-by-line port of the original backend. It is a fresh implementation organized around responsibility boundaries.

## Layer model

The backend currently follows a typical Clean Architecture split:

- `presentation`: Tauri commands and API boundaries
- `application`: services, use cases, and DTO orchestration
- `domain`: core models, repository contracts, and domain errors
- `infrastructure`: filesystem access, HTTP integrations, repository implementations, logging, and other technical details

## Why it is split this way

### Stable dependency direction

Outer layers depend on inner layers, while inner layers do not depend on outer ones. That keeps business models separate from UI, protocol, and storage details.

### Easier implementation replacement

When storage, upstream APIs, or host boundaries change, outer layers can be replaced with less damage to core logic.

### Easier testing

Services depend on repository interfaces rather than concrete implementations, which makes unit and integration testing easier to separate.

## Good candidates for future docs

- Application startup and dependency wiring
- Service boundaries and responsibilities
- File storage and user data directory strategy
- AI provider integration and payload normalization
