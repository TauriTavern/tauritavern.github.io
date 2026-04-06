# Docs Workflow

## Adding a page

1. Create a Markdown file under `docs/` for the right topic area.
2. Register it in `docs/.vitepress/config.ts` under `nav` or `sidebar`.
3. Run `pnpm docs:dev` and verify navigation, links, and hierarchy.

For bilingual pages, keep both paths in sync:

- Chinese: `docs/<section>/<page>.md`
- English: `docs/en/<section>/<page>.md`

## Recommended content structure

To keep future maintenance lighter, organize content by problem domain rather than by original filename:

- `guide/`: onboarding, contribution flow, documentation conventions
- `architecture/`: stable system models and layers
- `api/`: public contracts, extension interfaces, host capabilities
- `en/`: English mirror pages, ideally matching the Chinese structure

If a document from the main repo is mostly a temporary implementation note, extract the stable conclusions first before moving the whole file.

## Writing advice

- Let one page answer one core question.
- Explain why something exists before how to use it.
- Lock down stable contracts before implementation details.
- Keep current behavior and future plans in separate sections when possible.

## Publishing

Every push to `main` triggers the GitHub Pages workflow automatically.  
If you later change the output directory or package manager, update `.github/workflows/deploy.yml` as well.
