# Introduction

TauriTavern is a refactor that ports `SillyTavern` into a native `Tauri` runtime:

- The frontend is based on `SillyTavern 1.16.0`, with upstream behavior preserved as much as possible.
- The request pipeline is intercepted by the Tauri host, routing local API calls from `fetch` and `jQuery.ajax` into the Rust backend.
- The backend is not a direct Node.js port. It is a fresh Rust implementation organized around `Clean Architecture`.

## What this docs site is for

This site is meant to be more than an expanded README:

- It helps new contributors understand project boundaries and layers quickly.
- It gives APIs and host contracts a stable place to live and be referenced.
- It turns design notes from the main repository into a clearer long-term knowledge base.

## Suggested reading order

1. Start with [Getting Started](/en/guide/getting-started) to understand the repo layout and local workflow.
2. If you want to use or adapt the new generation workflow, read [Agent Overview](/en/agent/).
3. Read [Architecture Overview](/en/architecture/overview) to build the mental model.
4. Move into [Frontend Integration](/en/architecture/frontend) or [Backend Layers](/en/architecture/backend) as needed.
5. Use the [API section](/en/api/) once host-facing contracts are ready to be documented formally.
