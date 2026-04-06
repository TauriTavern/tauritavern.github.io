# Tech Stack

## Core foundations

- `Tauri v2`: cross-platform native application runtime
- `Rust`: backend and native capability implementation
- `SillyTavern 1.16.0`: frontend source and compatibility baseline

## Frontend

- `HTML / CSS / JavaScript`
- `jQuery`
- `Bootstrap`
- `Webpack`

The frontend is not being redesigned as a new SPA. It is adapted into the host while preserving upstream behavior.

## Backend

- `tokio`: async runtime
- `reqwest`: HTTP client
- `serde`: serialization and deserialization
- `thiserror`: error modeling
- `async-trait`: async trait support

## Docs site

- `VitePress`
- `Vue`
- `GitHub Pages`
- `GitHub Actions`

That means the docs site itself should stay lightweight: Markdown first, restrained theme customization, and complexity spent on content rather than framework mechanics.
