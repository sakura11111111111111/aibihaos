# 🚀 生产环境部署指南 (Deployment Guide)

> **版本**: v1.0.0
> **适用环境**: Linux (Ubuntu/CentOS), Windows Server
> **前提条件**: Node.js v14+, MySQL 5.7+

---

## 🏗️ 1. 部署架构概览
本项目是一个前后端分离的 Monorepo，生产环境通常采用 **Nginx 反向代理** 的模式：

```text
用户浏览器 -> Nginx (80/443) 
              ├── /api/  -> 反向代理 -> 后端 Node.js (3000)
              └── /      -> 静态文件 -> 前端构建产物 (dist/)
```

---

## 🛠️ 2. 后端部署 (Server)

### 2.1 环境准备
1.  **安装 Node.js**: 确保服务器安装了 Node.js (建议 v16 或 v18 LTS)。
2.  **安装 PM2**: 用于进程守护，防止服务崩溃。
    ```bash
    npm install -g pm2
    ```

### 2.2 数据库迁移
1.  在生产环境 MySQL 中创建数据库 `advanced_notes_db`。
2.  导入表结构：
    ```bash
    mysql -u root -p advanced_notes_db < database/schema.sql
    ```

### 2.3 启动服务
1.  进入后端目录：
    ```bash
    cd server
    ```
2.  安装依赖：
    ```bash
    npm install --production
    ```
3.  配置环境变量：
    复制 `.env.example` 为 `.env`，并填入生产环境数据库密码。
    ```bash
    cp .env.example .env
    # 编辑 .env 文件，设置 DB_PASSWORD
    ```
4.  使用 PM2 启动：
    ```bash
    pm2 start server.js --name "notes-backend"
    ```
    *(查看状态: `pm2 status`, 查看日志: `pm2 logs`)*

---

## 📦 3. 前端部署 (Client)

### 3.1 构建产物
在本地或构建服务器上执行：
```bash
# 在项目根目录
npm install
npm run build
```
这将在根目录下生成一个 `dist/` 文件夹，里面包含了所有静态资源（HTML, CSS, JS）。

### 3.2 配置 Nginx
将 `dist/` 文件夹上传到服务器（例如 `/var/www/notes-app/dist`），然后配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 1. 前端静态资源
    location / {
        root /var/www/notes-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # 关键：支持 Vue/React 路由模式
    }

    # 2. 后端 API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000/; # 转发给本地 Node 服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
重启 Nginx: `sudo nginx -s reload`

---

## 🛡️ 4. 安全与维护建议

1.  **数据库安全**:
    *   不要使用 `root` 用户连接应用，建议创建一个权限受限的 `notes_user`。
    *   确保 MySQL 端口 (3306) 不对外网直接开放。

2.  **数据备份**:
    *   设置定时任务 (Cron Job) 每天备份数据库：
    ```bash
    mysqldump -u root -p advanced_notes_db > /backup/notes_db_$(date +%F).sql
    ```

3.  **日志监控**:
    *   定期检查 `pm2 logs` 看是否有报错。
    *   Nginx 的 `access.log` 和 `error.log` 也是排查问题的关键。
