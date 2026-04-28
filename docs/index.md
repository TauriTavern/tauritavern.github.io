---
layout: home

hero:
  name: TauriTavern Docs
  text: 全平台原生！
  tagline: 面向 TauriTavern 的架构、API、开发流程与工程约束文档站。
  image:
    src: /logo.png
    alt: TauriTavern
  actions:
    - theme: brand
      text: 开始阅读
      link: /guide/introduction
    - theme: alt
      text: API 接入
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/Darkatse/TauriTavern

features:
  - title: 原生运行时
    details: 基于 Tauri v2，目标是以更轻量的方式承载 SillyTavern 体验，并面向桌面与移动平台扩展。
  - title: Rust 后端
    details: 后端按 Clean Architecture 分层重构，将命令边界、应用服务、领域模型与基础设施实现明确拆开。
  - title: 上游兼容
    details: 前端保留 SillyTavern 1.16.0，并通过模块化注入、请求拦截与宿主 ABI 维持兼容与可维护性。
  - title: 文档先行
    details: 站点按“先稳信息架构，再逐步补内容”搭建，方便后续持续迁移与沉淀项目知识。
---

> 这是一套为持续写作准备的基础骨架。后续可按专题逐步把主仓库中的设计说明、API 契约与现状文档迁移进来。
