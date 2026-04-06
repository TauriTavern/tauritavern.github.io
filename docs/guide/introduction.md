# 项目介绍

TauriTavern 是一个把 `SillyTavern` 移植到 `Tauri` 原生运行时中的重构项目：

- 前端以 `SillyTavern 1.16.0` 为基础，尽量保持上游行为与交互体验。
- 请求链路由 Tauri 宿主接管，通过拦截 `fetch` 与 `jQuery.ajax` 将本地 API 分发到 Rust 后端。
- 后端不再沿用原始 Node.js 服务端，而是按 `Clean Architecture` 思路重构为新的 Rust 实现。

## 这套文档站要解决什么问题

本网站是面向持续开发的知识库入口：

- 让新协作者快速理解项目边界与分层。
- 让 API 与宿主契约有稳定、可引用的落点。
- 让主仓库里逐步积累的设计说明能够被整理成更清晰的公开文档。

## 推荐阅读顺序

1. 从 [快速开始](/guide/getting-started) 了解仓库关系与本地运行方式。
2. 从 [架构总览](/architecture/overview) 建立整体模型。
3. 按需要进入 [前端集成](/architecture/frontend) 或 [后端分层](/architecture/backend)。
4. 当需要对外稳定说明时，再补充到 [API 文档](/api/)。
