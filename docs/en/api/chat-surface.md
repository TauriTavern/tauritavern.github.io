---
description: Safely attach message decorations, observers, and iframe runtimes when chat DOM virtualization is enabled.
---

# ChatSurface API

A chat is not the same thing as the message nodes currently on screen. The complete conversation lives in `chat[]`. The elements under `#chat > .mes` are only the part that the host has mounted temporarily for the current viewport. The distinction is easy to miss in a short chat. In a chat with thousands of messages, keeping every message, listener, and iframe alive makes layout work and runtime cost grow with the entire history.

TauriTavern's chat DOM virtualization mounts only the messages it currently needs. When a `.mes` leaves the DOM, its message has not been deleted. If it comes back into view, TauriTavern may build a new DOM element for it from `chat[]`.

ChatSurface handles that handoff. The host decides which messages are mounted. An extension describes what it adds to each mounted message and gives those resources back when that message leaves. ChatSurface does not hold a second copy of chat state, and it does not expose control over the virtualizer.

> The complete chat lives in `chat[]`. The DOM presents only the part needed right now.

This page calls the temporary DOM slice a projection. A participant is the small adapter an extension registers with ChatSurface. A runtime is a live resource such as an iframe, timer, or observer that must be released explicitly.

[[toc]]

## Decide whether you need ChatSurface

If an extension only reads or changes message data, keep using SillyTavern's `chat[]` and existing message APIs. ChatSurface is for work attached to message DOM.

| What the extension needs to do | Use |
| --- | --- |
| Read, search, or change any message | `chat[]` or an existing message API |
| Rewrite message content synchronously before commit | `prepareContent` |
| Add buttons, listeners, or observers to a mounted message | `didMount` |
| Decorate the current version of `.mes_text` | `didCommitContent` |
| Create an iframe, timer, or another expensive runtime | Claim a source in `prepareContent`, then create it only after a grant |

Do not use `document.querySelectorAll('#chat > .mes')` to count messages or scan the whole history. With virtualization enabled, that query sees only the current projection.

## Choose one rendering path

The ChatSurface API is available only in TauriTavern. An extension that also supports upstream SillyTavern should keep its static renderer and read the ownership decision once during startup:

```js
const chatSurface = window.__TAURITAVERN__?.api?.chatSurface;
const managed = chatSurface?.isManagedOwnershipRequired?.() === true;

if (managed) {
    startManagedRenderer(chatSurface);
} else {
    startLegacyRenderer();
}
```

The result of `isManagedOwnershipRequired()` does not change during the current page lifetime.

- If it returns `true`, start only the ChatSurface participant.
- If it returns `false`, or the API is absent, start only the original renderer.

The presence of the API does not mean that virtualization is enabled. The current number of `.mes` elements does not tell you who owns the surface either. Starting both renderers gives both of them a chance to attach listeners and create iframes, which leads to duplicate UI and leaked resources.

The Host API is ready when `hooks.activate` runs. The entry module may define both renderers, but it should not start a legacy observer as an import side effect. Read the ownership decision first, then choose a path.

## What happens to one message

A message moves through a small number of lifecycle stages:

1. The host creates a detached `.mes_text` from `chat[]`.
2. `prepareContent` may rewrite that content synchronously and identify elements that may need a runtime later.
3. The host commits the complete message to the live DOM, then calls `didMount` and `didCommitContent`.
4. A claimed source does not receive a runtime automatically. The host grants runtimes according to the current resource budget and calls `activate` only after a grant.
5. When the message unmounts, its content is replaced, or a runtime grant is revoked, the host aborts the corresponding `signal` and then calls the returned disposer synchronously.

Remounting a message is a view change, not a chat operation. ChatSurface does not emit fake `MESSAGE_UPDATED`, `MORE_MESSAGES_LOADED`, `USER_MESSAGE_RENDERED`, or `CHARACTER_MESSAGE_RENDERED` events for it. Code that follows DOM lifetime belongs in participant hooks instead of trying to infer mounts from those events.

## Register a participant

Export an activation function from the extension entry module and register it through `hooks.activate` in the manifest. Stop the managed path immediately if the protocol version is unsupported.

```js
let registration;

export function activate() {
    const api = window.__TAURITAVERN__?.api?.chatSurface;
    const managed = api?.isManagedOwnershipRequired?.() === true;

    if (!managed) {
        startLegacyRenderer();
        return;
    }
    if (api.protocolVersion !== 1 || typeof api.registerParticipant !== 'function') {
        throw new Error('ChatSurface participant v1 is unavailable');
    }

    registration = api.registerParticipant({
        id: 'my-extension/message-ui',
        protocolVersion: 1,

        didMount({ element, mesid }) {
            const toolbar = element.querySelector('.mes_buttons');
            if (!(toolbar instanceof HTMLElement)) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Copy mesid';
            const onClick = () => navigator.clipboard.writeText(String(mesid));

            button.addEventListener('click', onClick);
            toolbar.append(button);

            return () => {
                button.removeEventListener('click', onClick);
                button.remove();
            };
        },
    });
}
```

The matching manifest entry is:

```json
{
    "js": "dist/index.js",
    "hooks": {
        "activate": "activate"
    }
}
```

Keep the participant `id` stable and namespace it to the extension. The same id may be registered only once during a page lifetime.

## What each hook owns

```ts
type ChatSurfaceParticipantV1 = {
    id: string;
    protocolVersion: 1;
    prepareContent?: (
        context: { mesid: number; content: HTMLElement },
        claims: RuntimeClaims,
    ) => void;
    didMount?: (context: MountedContext) => void | Disposable;
    didCommitContent?: (context: MountedContext) => void | Disposable;
};

type MountedContext = {
    mesid: number;
    element: HTMLElement;
    content: HTMLElement;
    signal: AbortSignal;
};

type Disposable = (() => void) | { dispose(): void };
```

`mesid` is the message's current position in `chat[]`, not a permanent id across chats or structural edits. Use it only within the lifetime of the current hook or activation.

### `prepareContent`

Its `content` value is a detached `.mes_text`. This is the place to expand macros, create stable wrappers, and find runtime sources.

The phase has strict limits:

- It must finish synchronously and return `undefined`.
- It must not create an iframe, timer, or observer, or start asynchronous work.
- It must not replace `content` itself or move it elsewhere.
- `claims` is valid only until the current call returns.

There are no long-lived resources in this detached phase. Normal DOM changes made to `content` are committed or discarded with that version of the content.

### `didMount`

`element` is the connected `.mes`, and `content` is its `.mes_text`. This hook lives as long as the message root. It is a good fit for floor buttons, root observers, and references to `element`.

The host may keep the same `.mes` while replacing its content. `didMount` does not run again in that case, so content-version state does not belong here.

### `didCommitContent`

This hook runs after one version of `.mes_text` has been committed. Use it for content decorators, code-block buttons, and references that should live only until the next content replacement. The host calls its disposer when the content changes or the message unmounts.

`didMount` and `didCommitContent` may return nothing. If they create something that needs releasing, they should return a cleanup function or an object with `dispose()`.

## Create expensive runtimes only when granted

An iframe, a recurring timer, or an observer should not start merely because its message entered the DOM. `claims.claim(source, activate)` separates "a runtime can be created here" from "the runtime may run now."

```ts
type RuntimeClaims = {
    claim(
        source: Element,
        activate: (context: {
            mesid: number;
            source: Element;
            element: HTMLElement;
            content: HTMLElement;
            signal: AbortSignal;
        }) => Disposable,
    ): void;
};
```

The `source` must be a descendant of the current detached `content`, and only one participant may claim it. The host may grant it later or never grant it at all. A mounted message does not imply that all of its runtimes are active, so the initial pending state should leave a harmless fallback.

The following example turns a code block into an iframe preview. `prepareContent` creates only a stable host and claims the source. It creates the iframe during activation.

```js
function preparePreviews({ content }, claims) {
    for (const source of content.querySelectorAll('pre[data-live-preview]')) {
        const host = document.createElement('div');
        host.className = 'my-preview-host';
        source.replaceWith(host);
        host.append(source);
        claims.claim(source, activatePreview);
    }
}

function activatePreview({ source }) {
    const host = source.parentElement;
    if (!(host instanceof HTMLDivElement) || !host.classList.contains('my-preview-host')) {
        throw new Error('Preview host is missing');
    }

    const iframe = document.createElement('iframe');
    iframe.title = 'Message preview';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = source.textContent ?? '';

    const previousIframeHeight = Number(host.dataset.iframeHeight);
    if (previousIframeHeight > 0) {
        iframe.style.height = `${previousIframeHeight}px`;
    }

    source.hidden = true;
    host.append(iframe);
    delete host.dataset.iframeHeight;
    host.style.removeProperty('height');
    host.style.removeProperty('visibility');
    host.inert = false;
    host.removeAttribute('aria-hidden');

    return () => {
        const hostHeight = Math.ceil(host.getBoundingClientRect().height);
        const iframeHeight = Math.ceil(iframe.getBoundingClientRect().height);

        if (hostHeight > 0 && iframeHeight > 0) {
            host.dataset.iframeHeight = String(iframeHeight);
            host.style.height = `${hostHeight}px`;
            host.style.visibility = 'hidden';
            host.inert = true;
            host.setAttribute('aria-hidden', 'true');
        }

        iframe.src = 'about:blank';
        iframe.remove();
    };
}
```

When a previously visible runtime is revoked, its stable host should remain as an equal-height, `inert` placeholder that holds no iframe, timer, listener, or observer. Releasing the runtime then does not collapse the scroll position. On the next grant, give the saved height to the new runtime first and let the renderer's own height protocol take over from there.

Do not move a claimed source or keep it in a detached fragment for reuse by another message. The source is the anchor used to rebuild this runtime, and its object identity belongs to the current content version.

## Synchronous cleanup is part of the contract

Every hook, activation, and disposer must be synchronous. The host needs to know who owns each resource before one DOM commit finishes and must know that old resources are gone before the next commit starts. A Promise leaves a period where ownership cannot be determined, so the API treats asynchronous returns as errors.

The host aborts `signal` before calling the disposer. You may pass this signal to browser APIs that accept cancellation, but it does not replace the disposer. Runtime activation must always return one. Other hooks should return one whenever they create a resource that needs cleanup.

After cleanup, there should be no remaining:

- strong references to the old `element`, `content`, or `source`;
- active timers, listeners, observers, or animation frames;
- iframes, `contentWindow` mappings, or runtime DOM moved elsewhere on the page.

## How errors propagate

Invalid registration fields, an unsupported protocol, duplicate claims, asynchronous returns, and ownership mismatches throw immediately. An error thrown by a hook faults the current managed ChatSurface.

If an error occurs outside a hook and the participant can no longer honor its contract, report it through the registration:

```js
try {
    await operationOwnedByTheRenderer();
} catch (error) {
    registration.fault(error);
    throw error;
}
```

A fault preserves the complete `chat[]` and the DOM that is already mounted. It does not silently expand the whole history or switch to the legacy renderer. A silent switch would leave two possible owners, which is harder to recover from than an explicit failure.

## Boundaries to know before publishing

Every participant must register before the first chat projection. Hot registration and unregistration are not supported after that point. TauriTavern currently activates and validates two adapted renderers during the early startup phase:

| Extension | Participant id |
| --- | --- |
| JS-Slash-Runner | `js-slash-runner/message-runtime` |
| LittleWhiteBox | `littlewhitebox/message-runtime` |

A new third-party renderer that depends on managed ChatSurface must also coordinate its startup capability with TauriTavern. Adding `hooks.activate` to a manifest does not by itself ensure that an unknown extension will register before the first projection.

An entry in this table means that the base participant is connected. It does not make every optional mode in that extension compatible. Settings that cannot honor the managed lifecycle should fail during activation instead of continuing with part of the legacy owner still running.

ChatSurface v1 promises the lifecycle described on this page. It does not promise a viewport range, overscan value, DOM limit, runtime count, or grant order. Those policies may vary by device and release, and extensions should not persist state based on them.

Before publishing, test the static and managed paths separately. Exercise scrolling, content updates, editing, swipes, deletion, and chat switches. After sustained scrolling, the number of iframes, observers, and listeners should settle instead of growing with every message that has passed through the viewport.

## API summary

```ts
type ChatSurfaceApiV1 = {
    readonly protocolVersion: 1;
    isManagedOwnershipRequired(): boolean;
    registerParticipant(
        participant: ChatSurfaceParticipantV1,
    ): {
        fault(error: unknown): void;
    };
};
```

The public entry point is:

```js
window.__TAURITAVERN__.api.chatSurface
```

This is the Host API contract. Do not depend on TauriTavern's internal controller, virtualizer, projection snapshots, or resource-budget objects. They are implementation details rather than extension API.
