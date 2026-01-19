# Git 分支与版本历史说明文档

## 📌 当前状态 (Current State)
*   **当前所在分支**: `master` (生产环境主分支)
*   **最后一次提交**: `Merge feature/backend-init` - 后端功能全量合并
*   **代码稳定性**: 🟢 **稳定** (包含完整的前后端全栈功能)

## 🌿 分支清单 (Branch List)

| 分支名称 | 用途说明 | 状态 | 关键特性 |
| :--- | :--- | :--- | :--- |
| **master** | **生产环境主分支** | � **活跃 (当前)** | MySQL对接、MVC架构、API解耦、完整待办事项 |
| **feature/backend-init** | 后端对接与架构重构 | ✅ 已合并 | (已合入 master，可归档) |
| **feature/todo-list-v2** | 待办事项功能开发 | ✅ 已合并 | (已合入 master，可归档) |
| **yuanshi-beifen** | 原始代码备份 | 🔒 归档 | 最早期的 Vanilla JS 版本 |
| **gongneng-shujubeifen** | 旧功能备份 | ⚠️ 已废弃 | - |

---

## 📅 版本历史 (Changelog)

### 🚀 v1.1.0 - Backend Integration & Refactor (当前版本)
> **里程碑**: 完成前后端分离架构，引入 MySQL 持久化存储。

*   **2026-01-19**: `Merge feature/backend-init`
    *   🎉 **全栈发布**: 将后端服务与前端重构代码合并至主分支。

*   **2026-01-19**: `Refactor: Decouple Frontend API Layer`
    *   ✨ **前端架构升级**: 拆分 `store.js` 为 `src/api/` 模块。

*   **2026-01-19**: `Refactor: Decouple backend into Controllers and Routes`
    *   ✨ **后端架构升级**: 实现 MVC 模式，代码瘦身。

*   **2026-01-19**: `Fix: Resolve Chinese encoding issues`
    *   🐛 **修复乱码**: 强制 `utf8mb4` 字符集。

---

### � v1.0.0 - Frontend Features (旧版本)

#### feature/review-modes-management
*   `Feat: Implement Manage Review Modes` - 复习模式管理功能。

#### feature/todo-list-v2
*   `Feat: Implement Todo list` - 待办事项核心功能。

---

## 🤝 交接注意事项 (Handover Notes)

### 1. 文档索引
*   **架构指南**: 请参阅 `BACKEND_GUIDE.md`
*   **部署指南**: 请参阅 `docs/DEPLOY_GUIDE.md` (新)

### 2. 环境依赖
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

