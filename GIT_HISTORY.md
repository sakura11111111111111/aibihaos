# Git 分支与版本历史说明文档

## 📌 当前状态 (Current State)
*   **当前所在分支**: `dev` (开发分支)
*   **生产环境分支**: `master` (与 dev 保持同步，已部署到云端)
*   **最后一次关键提交**: `Fix: use relative api path for production` - 修复前端 API 路径以适配云环境
*   **代码稳定性**: 🟢 **稳定** (云端部署验证通过)

## 🌿 分支清单 (Branch List)

| 分支名称 | 用途说明 | 状态 | 关键特性 |
| :--- | :--- | :--- | :--- |
| **master** | **生产环境主分支** | 🚀 **已部署** | 微信云托管生产环境代码，稳定版本 |
| **dev** | **开发分支** | 🔨 **活跃 (当前)** | 包含 Docker 配置、DB 端口适配、API 路径修正等最新改动 |
| **feature/backend-init** | 后端对接与架构重构 | ✅ 已合并 | (已合入 master，可归档) |
| **feature/todo-list-v2** | 待办事项功能开发 | ✅ 已合并 | (已合入 master，可归档) |
| **yuanshi-beifen** | 原始代码备份 | 🔒 归档 | 最早期的 Vanilla JS 版本 |
| **gongneng-shujubeifen** | 旧功能备份 | ⚠️ 已废弃 | - |

---

## 📅 版本历史 (Changelog)

### ☁️ v1.2.0 - Cloud Deployment (当前版本)
> **里程碑**: 完成微信云托管部署，实现 Docker 容器化与云数据库连接。

*   **2026-01-20**: `Fix: use relative api path for production`
    *   � **修复 API 路径**: 前端请求从写死 `localhost:3000` 改为相对路径 `/api`，解决云端 500 错误。

*   **2026-01-20**: `Feat: support custom db port`
    *   ✨ **支持非标端口**: 后端 `db.js` 增加 `DB_PORT` 环境变量支持，适配云数据库外网端口 (21379)。

*   **2026-01-20**: `Chore: add db connection debug logs`
    *   🔧 **调试增强**: 增加详细的数据库连接参数日志（密码脱敏），便于排查连接问题。

*   **2026-01-20**: `Feat: add Dockerfile and deployment configs`
    *   🐳 **容器化**: 添加 `Dockerfile` 和 `docker-compose.yml`，支持一键构建部署。

### �🚀 v1.1.0 - Backend Integration & Refactor (上一个版本)
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

###  v1.0.0 - Frontend Features (旧版本)

#### feature/review-modes-management
*   `Feat: Implement Manage Review Modes` - 复习模式管理功能。

#### feature/todo-list-v2
*   `Feat: Implement Todo list` - 待办事项核心功能。

---

## 🤝 交接注意事项 (Handover Notes)

### 1. 文档索引
*   **部署总结**: 请参阅 `DEPLOYMENT_SUMMARY.md` (包含云端账号密码、访问地址等敏感信息)
*   **架构指南**: 请参阅 `BACKEND_GUIDE.md`

### 2. 环境依赖
*   **Node.js**: v18+ (云端环境) / v14+ (本地开发)
*   **MySQL**: v8.0 (云端 CynosDB) / v5.7+ (本地)
*   **Database**: `advanced_notes_db` (字符集 `utf8mb4`)

### 3. 启动流程 (本地开发)
1.  **一键启动 (推荐)**:
    直接运行根目录下的 `deploy.bat` (Windows)

2.  **手动启动**:
    ```bash
    # 启动后端 (Port 3000)
    cd server
    npm run dev

    # 启动前端 (Port 5173 - 仅开发模式)
    # 生产模式下前端由后端静态托管，无需单独启动
    npm run dev
    ```