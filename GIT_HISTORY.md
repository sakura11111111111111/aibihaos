# Git 分支与版本历史说明文档

## 📌 当前状态 (Current State)
*   **当前所在分支**: `feature/backend-init` (后端初始化与前后端解耦)
*   **最后一次提交**: `877ea1d` - `Refactor: Decouple Frontend API Layer`
*   **代码稳定性**: 🟢 **稳定** (前后端已联调，关键路径测试通过)

## 🌿 分支清单 (Branch List)

| 分支名称 | 用途说明 | 状态 | 关键特性 |
| :--- | :--- | :--- | :--- |
| **master** | 生产环境主分支 | 🟢 稳定 | 纯前端版本，无后端依赖 |
| **feature/todo-list-v2** | 待办事项功能开发 | 🚀 开发中 | 新版日历视图、拖拽排序 |
| **feature/backend-init** | **后端对接与架构重构** | 🔥 **活跃 (当前)** | MySQL对接、MVC架构、API解耦 |
| **yuanshi-beifen** | 原始代码备份 | 🔒 归档 | 最早期的 Vanilla JS 版本 |
| **gongneng-shujubeifen** | 旧功能备份 | ⚠️ 已废弃 | - |

---

## 📅 版本历史 (Changelog)

### 🚀 feature/backend-init (后端对接分支)
> **目标**: 引入 Node.js + MySQL 后端，实现数据持久化，并重构代码架构。

*   **2026-01-19**: `Refactor: Decouple Frontend API Layer` (877ea1d)
    *   ✨ **前端架构升级**: 将 `store.js` 中的网络请求拆分到 `src/api/` 目录。
    *   📂 **新增模块**: `api/notes.js`, `api/categories.js`, `api/reviewModes.js`, `api/config.js`。
    *   🧹 **代码清理**: `store.js` 仅负责状态管理，不再包含 HTTP 请求细节。

*   **2026-01-19**: `Refactor: Decouple backend into Controllers and Routes` (ac9f88c)
    *   ✨ **后端架构升级**: 实现 MVC 模式（Controller + Route）。
    *   📂 **目录拆分**: 
        *   `server/controllers/`: 存放业务逻辑 (Note, Category, ReviewMode)。
        *   `server/routes/`: 存放路由定义。
    *   📉 **代码瘦身**: `server.js` 从 200+ 行减少到 <60 行。

*   **2026-01-19**: `Fix: Resolve Chinese encoding issues`
    *   🐛 **修复乱码**: 强制数据库连接使用 `utf8mb4` 字符集。
    *   🔄 **数据重置**: 更新“清空数据”接口，确保默认数据以正确编码重新插入。

*   **2026-01-19**: `Feat: Connect frontend to backend`
    *   🔌 **前后端打通**: 实现完整的 CRUD 流程。
    *   🗑️ **移除旧逻辑**: 彻底移除 `localStorage` 存储方案。

*   **2026-01-19**: `Feat: Initialize backend environment`
    *   🌱 **项目初始化**: 搭建 Express + MySQL 基础环境。

---

### 📅 旧版本历史 (Legacy)

#### feature/review-modes-management
*   `Feat: Implement Manage Review Modes` - 复习模式管理功能。
*   `Refactor: Update Ebbinghaus schedule` - 调整默认复习间隔。

#### feature/todo-list-v2
*   `Feat: Add reschedule review date functionality` - 自定义调整复习日期。
*   `Fix: Resolve date offset bug in calendar` - 修复时区导致的日历红点偏差。
*   `Feat: Implement Todo list` - 待办事项核心功能。

---

## 🤝 交接注意事项 (Handover Notes)

### 1. 环境依赖
*   **Node.js**: v14+
*   **MySQL**: v5.7+ (必须运行在默认 3306 端口)
*   **Database**: `advanced_notes_db` (字符集 `utf8mb4`)

### 2. 启动流程
这是一个 **Monorepo** 风格的项目，需要同时启动前后端：

1.  **启动后端** (Port 3000):
    ```bash
    cd server
    npm run dev
    ```
    *检查日志: `Server is running on http://localhost:3000`*

2.  **启动前端** (Port 5173):
    ```bash
    # 在项目根目录
    npm run dev
    ```
    *检查日志: `Local: http://localhost:5173/`*

### 3. 常见问题
*   **Q: 页面显示乱码？**
    *   A: 请在“设置”页面点击红色“清空所有数据”按钮，重置数据库编码。
*   **Q: 无法连接数据库？**
    *   A: 检查 `server/.env` 中的 `DB_PASSWORD` 是否正确。
*   **Q: 新增 API 报错 404？**
    *   A: 记得在 `server/server.js` 中注册新路由，并在前端重启服务（如果修改了配置）。

