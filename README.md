# TauriTavern Docs

`TauriTavern` 文档站仓库，使用 `VitePress` 构建并通过 GitHub Pages 部署。

## 本地开发

```bash
pnpm install
pnpm docs:dev
```

## 常用命令

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

## 目录结构

```text
docs/
├── .vitepress/      # VitePress 配置、主题与样式
├── guide/           # 入门与写作工作流
├── architecture/    # 架构总览与分层说明
├── api/             # API 文档入口
└── public/          # 站点静态资源
```

## 部署

仓库已包含 `.github/workflows/deploy.yml`，推送到 `main` 后会自动部署到 GitHub Pages。
