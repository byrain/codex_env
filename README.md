# AI News Aggregator (中美 AI 新闻聚合)

一个可扩展的轻量项目：
- 单页面前端展示最新 10 条 AI 新闻
- 数据来自中美两个来源（Google News RSS 搜索）
- 点击标题可跳转原始新闻页面

## 快速开始

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`

## 当前架构

- `server/index.js`：Node HTTP API + RSS 聚合逻辑
- `public/index.html`：页面骨架
- `public/app.js`：前端渲染与交互
- `public/styles.css`：基础样式

## 扩展建议

- 新增数据源：在 `NEWS_FEEDS` 数组添加配置
- 去重策略：按 `link` 或规范化标题进行 dedupe
- 标签分类：按模型、公司、技术方向等分组
- 历史存储：接入 SQLite/PostgreSQL
- 前端升级：替换为 React/Vue 并保留 `/api/news` 协议
