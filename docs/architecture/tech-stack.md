# 技术栈

## 核心框架

- `Tauri v2`：跨平台原生应用运行时
- `Rust`：后端与本地能力实现
- `SillyTavern 1.16.0`：前端来源与兼容基线

## 前端侧

- `HTML / CSS / JavaScript`
- `jQuery`
- `Bootstrap`
- `Webpack`

前端以保留上游行为为前提进行宿主接入。

## 后端侧

- `tokio`：异步运行时
- `reqwest`：HTTP 客户端
- `serde`：序列化 / 反序列化
- `thiserror`：错误建模
- `async-trait`：异步 trait 支持

## 文档站侧

- `VitePress`
- `Vue`
- `GitHub Pages`
- `GitHub Actions`

这意味着文档站本身应尽量保持轻量：以 Markdown 为主，主题定制保持克制，把复杂度留给内容而不是站点框架。
