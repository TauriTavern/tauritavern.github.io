---
layout: home

hero:
  name: TauriTavern Docs
  text: Tauri v2 × Rust × SillyTavern 1.16.0
  tagline: Documentation for TauriTavern architecture, APIs, workflows, and engineering constraints.
  image:
    src: /logo.png
    alt: TauriTavern
  actions:
    - theme: brand
      text: Start Reading
      link: /en/guide/introduction
    - theme: alt
      text: API Integration
      link: /en/api/
    - theme: alt
      text: GitHub
      link: https://github.com/Darkatse/TauriTavern

features:
  - title: Native Runtime
    details: Built on Tauri v2 to carry the SillyTavern experience in a lighter native shell across desktop and mobile.
  - title: Rust Backend
    details: The backend is rebuilt with Clean Architecture layers, separating command boundaries, services, domain models, and infrastructure.
  - title: Upstream Compatibility
    details: The frontend stays aligned with SillyTavern 1.16.0 and remains maintainable through modular injection, request interception, and a stable host ABI.
  - title: Docs First
    details: The site is structured around stable information architecture first, so content can be migrated in gradually without locking future writing into the scaffold.
---

> This is a foundation prepared for long-term documentation work. Stable design notes, API contracts, and implementation snapshots can be migrated here over time.
