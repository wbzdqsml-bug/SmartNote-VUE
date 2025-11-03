# SmartNote 前端

使用 [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [Element Plus](https://element-plus.org/) 构建的 SmartNote Web 前端界面，对应 SmartNote 后端 API。

## 功能概览

- 📒 笔记管理：浏览、搜索、创建、编辑、删除笔记
- 🏷️ 标签管理：新增、重命名、删除标签
- ⚙️ 个性化：切换暗色/亮色主题、调整组件尺寸

界面基于 Element Plus 组件库设计，支持响应式布局与暗色模式。

## 开发环境

- Node.js 18+
- npm 9+

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 后端接口配置

默认后端接口基地址为 `http://localhost:8000/api`，可通过 `.env` 文件覆写：

```bash
# .env.local
VITE_API_BASE_URL=http://your-smartnote-backend/api
```

## 目录结构

```
src/
  api/           # 后端接口封装
  assets/        # 全局样式
  components/    # 可复用组件
  layouts/       # 布局组件
  router/        # 路由
  stores/        # Pinia 状态管理
  views/         # 页面视图
```

## 与 SmartNote 后端的接口约定

- `GET /notes/` 返回笔记列表，字段包含 `id`, `title`, `content`, `updated_at`, `tags`
- `POST /notes/` 创建笔记
- `PUT /notes/{id}/` 更新笔记
- `DELETE /notes/{id}/` 删除笔记
- `GET /notes/{id}/` 获取单条笔记详情
- `GET /tags/` 返回标签列表（字符串或 `{ name, count }` 结构）
- `POST /tags/`, `PUT /tags/{name}/`, `DELETE /tags/{name}/` 管理标签

若后端字段名称有所不同，可在 `src/api` 与 `src/stores/notes.js` 中进行适配。
