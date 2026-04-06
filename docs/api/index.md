# API 总览

这里用于沉淀 TauriTavern 对前端、扩展和外部开发者暴露的稳定接口。

## 文档目标

API 文档的重点回答：

- 入口是什么？
- 调用约束是什么？
- 返回值和错误语义是什么？
- 哪些行为属于稳定契约，哪些只是当前实现？

## 当前建议的组织方式

- `Layout API`：布局、面板、宿主界面能力
- `Extension API`：扩展在 TauriTavern 环境中的宿主接口
- 后续可继续补 `Chat API`、`System API`、`Storage API`

## 约定

如果某个能力属于宿主公开契约，优先以 `window.__TAURITAVERN__.api.*` 为唯一文档入口；不要把零散 helper 当作正式 API。
