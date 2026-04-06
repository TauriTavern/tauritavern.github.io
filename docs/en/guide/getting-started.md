# Getting Started

## Repository layout

The docs site is currently kept separate from the main codebase:

- Main repository: `TauriTavern`
- Docs repository: `tauritavern.github.io`

This keeps deployment simple and lets GitHub Pages work directly as the organization site without an extra project subpath.

## Local development

```bash
pnpm install
pnpm docs:dev
```

This starts the local VitePress dev server with hot reload for files under `docs/`.

## Build and preview

```bash
pnpm docs:build
pnpm docs:preview
```

`docs:build` outputs the static site to `docs/.vitepress/dist`, which matches the current GitHub Pages workflow.

## Recommended migration order

If you plan to move documents from the main repository into the site, this order tends to work best:

1. Migrate stable overview pages first.
2. Migrate API and contract pages that need durable public references next.
3. Move high-churn planning notes and implementation snapshots last.

That keeps the information architecture stable before the content volume grows.
