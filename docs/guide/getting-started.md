# 快速开始

## 仓库关系

当前文档站与主项目代码仓库分离：

- 主仓库：`TauriTavern`
- 文档站：`tauritavern.github.io`

这样做的好处是部署路径简单，GitHub Pages 可以直接作为组织主页站点使用，不需要额外的仓库子路径配置。

## 本地启动

```bash
pnpm install
pnpm docs:dev
```

默认会启动本地 VitePress 开发服务器，修改 `docs/` 下的 Markdown 与配置文件后会自动热更新。

## 构建预览

```bash
pnpm docs:build
pnpm docs:preview
```

`docs:build` 会输出静态站点到 `docs/.vitepress/dist`，与当前 GitHub Pages 工作流保持一致。

## 建议的迁移节奏

如果你准备把主仓库中的设计文档逐步迁移过来，建议按下面顺序进行：

1. 先迁移不会频繁变动的“总览型”文档。
2. 再迁移“需要对外引用”的 API / 契约类文档。
3. 最后处理实施计划、阶段性现状、实验性说明等高变化内容。

这样可以先把文档站的骨架稳定下来，避免信息架构反复调整。
