# 后端环境搭建指南

您已成功初始化后端项目结构！请按照以下步骤启动服务。

## 1. 准备数据库
确保您的电脑上已安装 MySQL，并且服务正在运行。

### 导入数据表结构
打开终端 (PowerShell 或 CMD)，运行以下命令将表结构导入数据库：
```bash
# 如果您的 MySQL root 用户没有密码：
mysql -u root < database/schema.sql

# 如果有密码，请运行（回车后输入密码）：
mysql -u root -p < database/schema.sql
```

## 2. 配置环境变量
检查 `server/.env` 文件。默认配置如下：
```ini
DB_USER=root
DB_PASSWORD=
DB_NAME=advanced_notes_db
```
如果您修改了 MySQL 密码，请务必更新 `DB_PASSWORD` 字段。

> **注意**：如果您的电脑存在全局的 `DB_PASSWORD` 环境变量导致连接失败（Access Denied），请保留代码中的 `dotenv.config({ override: true })` 配置，这将强制项目优先使用 `.env` 文件中的密码。

## 3. 启动后端服务
打开一个新的终端窗口：
```bash
cd server
npm run dev
```
如果看到 `Server is running on http://localhost:3000` 和 `Database connection successful`，说明后端已连接成功！

## 4. 前端对接 (已完成)
目前的 API 服务运行在 3000 端口。
前端代码 (`src/store.js`) 已经重构，不再使用 `localStorage`，而是通过 `fetch` 调用后端 API。

### 已实现的 API 接口：
*   `GET /api/notes` - 获取所有笔记
*   `POST /api/notes` - 创建或更新笔记
*   `DELETE /api/notes/:id` - 删除笔记
*   `GET/POST/DELETE /api/categories` - 分类管理
*   `GET/POST/DELETE /api/review-modes` - 复习模式管理
*   `POST /api/clear-all-data` - 一键清空数据库（用于重置）

### 常见问题
**中文乱码问题**：
如果发现复习模式名称显示为乱码，是因为 MySQL 连接默认字符集不匹配。我们已在 `config/db.js` 中强制设置了 `charset: 'utf8mb4'`。如果仍有乱码，请尝试在“设置”页面点击“清空所有数据”来重置默认数据。

## 5. 维护与扩展建议
### 数据备份
*   虽然有数据库，但建议定期使用 `mysqldump` 备份数据，或者使用前端的“导出数据”功能（目前导出的是前端状态快照，后续可优化为后端导出）。

### 代码解耦方向
*   **Controller 层 (已完成)**：路由逻辑已拆分到 `server/controllers/` 和 `server/routes/`，实现了 MVC 架构的 Controller 层和 Route 层分离。
*   **Model 层**：目前仍使用原生 SQL，后续可以引入 Sequelize 或 TypeORM 等 ORM 库。
*   **前端 API 层 (已完成)**：已将 `store.js` 中的 `fetch` 调用封装到独立的 `src/api/` 模块中，统一管理网络请求。
