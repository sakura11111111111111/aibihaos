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

## 4. 前端对接 (下一步)
目前的 API 服务运行在 3000 端口。
下一步我们需要修改前端代码 (`src/store.js`)，将 `localStorage` 的读写操作替换为 `fetch('http://localhost:3000/api/...')`。
