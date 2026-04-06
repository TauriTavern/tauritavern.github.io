# 架构总览

TauriTavern 的核心目标是把原有的 SillyTavern 体验稳定迁移到原生宿主中，并让后端从 Node.js 运行时切换为 Rust，构建全平台原生的App体验。

## 系统拆分

可以把项目理解为三层协作：

1. **上游前端层**：保留 SillyTavern 前端代码与用户可见行为。
2. **宿主集成层**：在 Tauri 环境里注入桥接、请求拦截、路由分发与宿主 ABI。
3. **Rust 后端层**：负责本地数据、命令处理、外部服务集成与领域逻辑。

## 设计原则

### 最小侵入

前端侧尽量通过注入与适配解决问题，而不是大面积改写上游代码。

### 契约收敛

把对前端、扩展与第三方脚本可见的宿主能力收敛到稳定入口，例如 `window.__TAURITAVERN__`。

### 分层演进

后端通过 `presentation / application / domain / infrastructure` 分层，把临时实现与长期契约区分开。

## 阅读地图

- 想理解请求如何被宿主接管：看 [前端集成](/architecture/frontend)
- 想理解 Rust 后端如何组织：看 [后端分层](/architecture/backend)
- 想理解技术选型与边界：看 [技术栈](/architecture/tech-stack)
