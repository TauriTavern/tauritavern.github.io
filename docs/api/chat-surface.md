---
description: 在聊天 DOM 虚拟化下安全接入消息装饰、观察器与 iframe runtime。
---

# ChatSurface API

聊天记录并不等于屏幕上的聊天节点。完整聊天始终在 `chat[]` 中；`#chat > .mes` 只是宿主为当前视口临时挂载的那一段。短聊天里，两者看起来几乎一样。聊天增长到几千楼以后，如果仍把每一楼、每个监听器和每个 iframe 永久留在页面里，浏览器要维护的布局和运行时便会随历史不断增加。

TauriTavern 的聊天 DOM 虚拟化只挂载当前需要的楼层。某个 `.mes` 离开 DOM，不表示对应消息被删除；它稍后回到可见窗口时，也可能由 `chat[]` 重新创建一份全新的 DOM。

ChatSurface 管理的正是这次交接，宿主决定哪些消息出现在 DOM 中，扩展说明自己要对一楼消息做什么，并在这楼离开时交还资源。它不保存第二份聊天状态，也不允许扩展控制虚拟列表策略。

> 完整聊天只认 `chat[]`；DOM 只负责呈现当前需要的那一段。

下文把这段临时 DOM 称为“投影”。participant 指扩展注册给 ChatSurface 的适配代码；runtime 指 iframe、timer、observer 等需要主动释放的运行资源。

[[toc]]

## 先判断是否需要 ChatSurface

如果扩展只读取或修改消息数据，继续使用 SillyTavern 的 `chat[]` 和消息接口即可。ChatSurface 只处理依附于消息 DOM 的工作。

| 扩展要做的事 | 应该使用什么 |
| --- | --- |
| 读取、搜索或修改任意楼层的数据 | `chat[]` 或既有消息 API |
| 在消息内容提交前做同步改写 | `prepareContent` |
| 给已挂载的楼层添加按钮、监听器或 observer | `didMount` |
| 装饰当前版本的 `.mes_text` | `didCommitContent` |
| 创建 iframe、定时器或其它较重的 runtime | 在 `prepareContent` 中 claim source，获得 grant 后再创建 |

不要用 `document.querySelectorAll('#chat > .mes')` 计算聊天长度或扫描完整历史。虚拟化开启后，它只能看到当前投影。

## 在两条渲染路径中选一条

ChatSurface API 只存在于 TauriTavern。扩展若也支持上游 SillyTavern，应保留原来的 static renderer，并在启动时读取一次所有权判断：

```js
const chatSurface = window.__TAURITAVERN__?.api?.chatSurface;
const managed = chatSurface?.isManagedOwnershipRequired?.() === true;

if (managed) {
    startManagedRenderer(chatSurface);
} else {
    startLegacyRenderer();
}
```

`isManagedOwnershipRequired()` 的结果在本次页面启动期间不变。

- 返回 `true` 时，只启动 ChatSurface participant。
- 返回 `false`，或者 API 不存在时，只启动原来的 renderer。

API 存在不等于虚拟化已经开启，当前 DOM 里有多少 `.mes` 也不能说明谁拥有聊天界面。不要同时启动两套 renderer；两边都会注册监听器和创建 iframe，很容易留下重复界面和无法释放的资源。

调用 `hooks.activate` 时，Host API 已经就绪。入口模块可以定义两套 renderer，但不要在模块加载的副作用中抢先启动 legacy observer；先读所有权判断，再选路径。

## 一楼消息会经历什么

ChatSurface 把一楼消息的生命周期拆成几个清晰的阶段：

1. 宿主从 `chat[]` 创建 detached 的 `.mes_text`。
2. `prepareContent` 可以同步改写这段内容，并声明其中哪些元素将来可能需要 runtime。
3. 宿主把整楼消息提交到 live DOM，然后调用 `didMount` 和 `didCommitContent`。
4. 被 claim 的 source 不会自动得到 runtime。宿主根据当前资源预算决定何时发放运行许可（grant）；获得许可后才调用 `activate`。
5. 楼层离开 DOM、内容被替换或 runtime 的许可被收回（revoke）时，宿主先 abort 对应的 `signal`，随后同步调用扩展返回的 disposer。

楼层重新挂载只是视图变化，不是聊天业务变化。ChatSurface 不会为此伪造 `MESSAGE_UPDATED`、`MORE_MESSAGES_LOADED`、`USER_MESSAGE_RENDERED` 或 `CHARACTER_MESSAGE_RENDERED`。需要跟随 DOM 寿命的逻辑应该放在 participant hook 中，而不是继续依赖这些事件猜测 mount 状态。

## 注册 participant

扩展在入口模块中导出 activation function，再通过 manifest 的 `hooks.activate` 注册。协议版本不匹配时应立即停止 managed 路径。

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

对应的 manifest：

```json
{
    "js": "dist/index.js",
    "hooks": {
        "activate": "activate"
    }
}
```

participant `id` 应长期稳定，并带上扩展命名空间。一次页面启动中，同一个 id 只能注册一次。

## 三个 hook 各自拥有什么

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

`mesid` 是消息在当前 `chat[]` 中的位置，不是跨聊天、跨结构修改的永久 id。只在本次 hook 或 activation 的寿命内使用它。

### `prepareContent`

这里的 `content` 是尚未连接到页面的 `.mes_text`。适合在这一阶段做宏替换、建立稳定容器，或者找出要 claim 的 source。

它有几条严格约束：

- 必须同步完成并返回 `undefined`。
- 不要创建 iframe、timer、observer，也不要启动异步任务。
- 不要替换 `content` 自身，或把它移到别处。
- `claims` 只在本次调用返回前有效。

detached 阶段没有需要长期持有的资源。你对 `content` 做出的普通 DOM 改写会随这次内容一起提交或丢弃。

### `didMount`

`element` 是已连接的 `.mes`，`content` 是其中的 `.mes_text`。这个 hook 的寿命与整楼 DOM 相同，适合楼层按钮、观察整楼的 observer 和指向 `element` 的引用。

消息内容更新时，宿主可能保留同一个 `.mes`。此时 `didMount` 不会重新执行，因此不要把只属于某一版内容的状态放在这里。

### `didCommitContent`

这个 hook 在一版 `.mes_text` 提交后执行。它适合内容装饰、代码块按钮以及只应活到下一次内容替换的引用。内容被替换或楼层卸载时，宿主会调用它的 disposer。

`didMount` 和 `didCommitContent` 都可以不返回值；一旦创建了需要释放的资源，就应返回 cleanup function 或带 `dispose()` 的对象。

## 让重型 runtime 按需存在

iframe、持续计时器和 observer 不应仅因为消息进入 DOM 就全部启动。`claims.claim(source, activate)` 把“这里可以创建 runtime”和“现在允许创建 runtime”分成两个时刻。

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

`source` 必须是当前 detached `content` 的后代，同一个 source 只能被一个 participant claim。宿主可以稍后 grant，也可以一直不 grant。扩展不能把“消息已挂载”理解成“runtime 一定已启动”，因此初次等待许可时应保留一个无副作用的 fallback。

下面的例子把一个代码块变成 iframe preview。`prepareContent` 只建立稳定容器并 claim source；iframe 到 activation 才创建。

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

当一个已经显示的 runtime 被 revoke 时，稳定容器应留下等高、`inert` 且不持有 iframe、timer、listener 或 observer 的 placeholder。这样释放资源不会同时让滚动位置突然塌缩。下次 grant 可以先把保存的高度交给新 runtime，再由 renderer 自己的高度协议继续校准。

不要移动被 claim 的 source，也不要把它存进 detached fragment 供另一楼复用。source 是这次内容中重建 runtime 的锚点，它的对象身份属于当前消息。

## 同步 cleanup 是契约的一部分

所有 hook、activation 和 disposer 都必须同步。宿主需要在一次 DOM 提交结束前确定资源由谁持有，并在下一次提交开始前确认旧资源已经释放。Promise 会留下一个无法判断 ownership 的间隙，因此 API 会把异步返回视为错误。

宿主在调用 disposer 前会先 abort `signal`。可以把这个 signal 传给支持取消的浏览器 API，但它不能代替 disposer：runtime activation 必须返回 disposer；其它 hook 只要创建了资源，也应返回 disposer。

清理完成后，不应再有：

- 指向旧 `element`、`content` 或 `source` 的强引用；
- 仍在运行的 timer、listener、observer 或 animation frame；
- iframe、其 `contentWindow` 映射，或被移到页面别处的 runtime DOM。

## 错误如何传播

注册字段、协议版本、重复 claim、异步返回或 ownership 失配都会立即抛错。hook 内抛出的错误会 fault 当前 managed ChatSurface。

如果错误发生在 hook 之外，而 participant 已经无法继续履约，使用注册结果报告它：

```js
try {
    await operationOwnedByTheRenderer();
} catch (error) {
    registration.fault(error);
    throw error;
}
```

fault 会保留完整 `chat[]` 和当前已经挂载的 DOM，但不会悄悄展开全部历史，也不会切回 legacy renderer。静默切换会让两套 owner 同时存在，通常比直接失败更难恢复。

## 发布前需要知道的边界

participant 必须在第一次聊天投影前完成注册，首次投影后不能热注册或热注销。当前 TauriTavern 会提前激活并校验两个已适配 renderer：

| Extension | participant id |
| --- | --- |
| JS-Slash-Runner | `js-slash-runner/message-runtime` |
| LittleWhiteBox | `littlewhitebox/message-runtime` |

新的第三方 renderer 若要依赖 managed ChatSurface，需要同时与 TauriTavern 协调启动 capability。仅在 manifest 中加入 `hooks.activate`，并不能保证一个尚未被平台识别的扩展赶在首次投影前注册。

出现在这张表里，只表示基础 participant 已接入；扩展自己的可选模式仍要逐项适配。无法履行 managed 生命周期的设置应在 activation 时明确拒绝，不要带着一半 legacy owner 继续运行。

ChatSurface v1 只承诺上面列出的生命周期，不承诺 viewport 范围、overscan、DOM 上限、runtime 数量或 grant 顺序。这些策略会随设备和版本调整，扩展不应据此保存状态。

发布前至少分别测试 static 与 managed 两条路径，并反复覆盖滚动、内容更新、编辑、swipe、删除和切换聊天。持续滚动后，iframe、observer 和 listener 的数量应回到稳定区间，而不是随经过的楼层一直增长。

## API 摘要

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

入口为：

```js
window.__TAURITAVERN__.api.chatSurface
```

这是正式 Host API。不要依赖 TauriTavern 内部的 controller、virtualizer、projection snapshot 或资源预算对象；它们不属于扩展契约。
