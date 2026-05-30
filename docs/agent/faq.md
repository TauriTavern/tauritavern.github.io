---
description: TauriTavern Agent 常见问题。
---

# 常见问题

<span id="agent-profile-model-from-api-connection"></span>

## API连接配置中保存模型后，如何在 Agent 配置里指定？

Agent Profile 不直接保存 API 密钥或临时模型输入。它会引用你已经在 `API连接配置` 中保存好的模型配置。

通常按这个顺序操作：

1. 先进入 `API连接配置`。
2. 添加或选择一个可用模型，并保存配置，**请注意选择`仅保存模型`**。
3. 再打开 `Agent 系统` 面板。
4. 进入要使用的 Agent Profile。
5. 在模型绑定区域选择“绑定模型连接”或同等选项。
6. 从已保存模型中选择刚才保存的模型。
7. 保存 Agent Profile。
8. 回到 Agent 面板，确认 `Active Profile` 是你要运行的 Profile。

如果导入的 Profile 显示“需要重新配置”，这通常不是配置损坏，而是因为导出的 Profile 不会携带他人的本机模型连接。按上面的步骤在本机重新指定模型即可。

如果模型没有出现在 Agent Profile 的选择列表里，先检查这几件事：

- `API连接配置` 中是否已经点击保存，而不是只在表单里填了内容。
- 该模型是否是当前 Agent 支持的 chat-completion 路径。
- 保存后是否重新打开或刷新了 Agent 配置面板。
- 当前编辑的 Profile 是否已经保存。

如果你只想让 Agent 跟随当前聊天使用的模型，可以继续使用“跟随当前生成快照”。只有在你希望 Agent 固定使用某个已保存模型时，才需要在 Profile 中单独指定模型。
