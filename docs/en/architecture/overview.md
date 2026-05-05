# Architecture Overview

The core goal of TauriTavern is not to rebuild the frontend from scratch. It is to move the SillyTavern experience into a native host and replace the backend runtime with Rust.

## System split

The project can be understood as three cooperating layers:

1. **Upstream frontend layer**: preserves SillyTavern code and user-visible behavior.
2. **Host integration layer**: injects the bridge, request interception, route dispatching, and host ABI inside Tauri.
3. **Rust backend layer**: handles local data, commands, external integrations, and domain logic.

## Design principles

### Minimal intrusion

Prefer injection and adaptation on the frontend side instead of large-scale upstream rewrites.

### Contract consolidation

Collect host-facing capabilities behind stable entry points such as `window.__TAURITAVERN__`.

### Layered evolution

Use `presentation / application / domain / infrastructure` on the backend so stable contracts can evolve separately from implementation details.

## Reading map

- To understand how requests are taken over by the host, read [Frontend Integration](/en/architecture/frontend)
- To understand how the Rust backend is organized, read [Backend Layers](/en/architecture/backend)
- To understand how Agent runs through workspaces, tools, and timeline events, read [Agent System Architecture](/en/architecture/agent)
- To understand the technology choices and boundaries, read [Tech Stack](/en/architecture/tech-stack)
