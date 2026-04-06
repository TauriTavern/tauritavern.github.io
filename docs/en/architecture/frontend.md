# Frontend Integration

The hard part of the TauriTavern frontend is not page authoring. It is how to connect a browser-style request model to native host capabilities without breaking upstream behavior.

## Startup chain

The current frontend startup flow can be summarized like this:

1. `init.js` orchestrates the loading order.
2. `lib.js` prepares stable exports for core dependencies.
3. `tauri-main.js` enters the Tauri host bootstrap path.
4. `bootstrap.js` assembles context, routes, interceptors, and the public ABI.

## Host responsibilities

The host integration layer mainly does four things:

- Builds the frontend-to-Rust bridge.
- Intercepts local API requests and dispatches them to routes.
- Exposes stable host capabilities.
- Applies mobile compatibility patches and download bridging.

## Key modules

### `context`

Acts as the Host Kernel facade, combining capabilities into a single entry point and centralizing invoke policies and shared helpers.

### `router` and `routes/*`

Split local API handling by problem domain, reducing single-file complexity and keeping future upstream sync conflicts smaller.

### `interceptors`

Proxy both `fetch` and `jQuery.ajax`, so upstream code can keep using familiar HTTP-shaped calls while the underlying execution moves to the local host.

### `window.__TAURITAVERN__`

This is the stable ABI entry point for extensions and third-party scripts. It is the right place for explicit host capabilities, not temporary implementation details.

## Good next docs to add

- A full request sequence from frontend call to Rust command
- Boundaries for each `routes/*` module
- Formal ABI docs for `window.__TAURITAVERN__.api.*`
- Responsibilities and limitations of the mobile compatibility layer
