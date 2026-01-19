# 🏗️ 后端架构与开发指南 (Backend Guide)

> **当前版本**: v1.1.0 (MVC 架构 + 前后端解耦)
> **更新时间**: 2026-01-19

## 📚 1. 项目结构 (Architecture)
本项目采用经典的 **MVC (Model-View-Controller)** 架构（View 层由前端 Vue 负责）。

```text
/
├── src/                # 前端源码 (View)
│   ├── api/            # [新] API 接口层 (与后端通信的桥梁)
│   ├── views/          # 页面组件
│   └── store.js        # 状态管理 (调用 api 层)
│
├── server/             # 后端源码
│   ├── config/
│   │   └── db.js       # MySQL 数据库连接池
│   │
│   ├── controllers/    # [新] 控制器层 (处理业务逻辑)
│   │   ├── noteController.js
│   │   ├── categoryController.js
│   │   └── reviewModeController.js
│   │
│   ├── routes/         # [新] 路由层 (定义 API URL)
│   │   ├── notes.js
│   │   ├── categories.js
│   │   └── reviewModes.js
│   │
│   └── server.js       # 入口文件 (仅负责启动服务和挂载路由)
│
└── database/
    └── schema.sql      # 数据库初始化脚本
```

---

## 🚀 2. 快速启动 (Quick Start)

### 2.1 环境准备
1.  **MySQL**: 确保本地安装并运行 MySQL 5.7+。
2.  **环境变量**: 检查 `server/.env` 文件。
    ```ini
    DB_USER=root
    DB_PASSWORD=your_password  <-- 如果有密码，请务必修改这里
    DB_NAME=advanced_notes_db
    ```

### 2.2 数据库初始化
如果还没建库，请运行：
```bash
mysql -u root -p < database/schema.sql
```

### 2.3 启动服务
```bash
cd server
npm run dev
```
看到 `Server is running on http://localhost:3000` 即表示成功。

---

## 🔗 3. API 接口文档 (API Reference)

### 📝 笔记 (Notes)
*   `GET /api/notes` - 获取所有笔记（包含复习状态）
*   `POST /api/notes` - 创建或更新笔记
*   `DELETE /api/notes/:id` - 删除笔记

### 📂 分类 (Categories)
*   `GET /api/categories` - 获取分类列表
*   `POST /api/categories` - 创建分类
*   `PUT /api/categories/:id` - 更新分类名称
*   `DELETE /api/categories/:id` - 删除分类

### 🧠 复习模式 (Review Modes)
*   `GET /api/review-modes` - 获取所有复习模式
*   `POST /api/review-modes` - 创建自定义复习模式
*   `DELETE /api/review-modes/:id` - 删除自定义模式

### ⚙️ 系统 (System)
*   `GET /api/test-db` - 测试数据库连接
*   `POST /api/clear-all-data` - **危险**: 清空所有用户数据并重置默认设置

---

## 🛠️ 4. 开发与维护 (Development)

### 新增一个 API 的步骤：
1.  **Controller**: 在 `server/controllers/` 下新建或修改控制器，编写业务逻辑（SQL 查询）。
2.  **Route**: 在 `server/routes/` 下定义 URL 路径，并指向对应的控制器方法。
3.  **Frontend API**: 在 `src/api/` 下封装对应的 `fetch` 请求。
4.  **Store/View**: 在前端页面调用封装好的 API。

### 常见问题排查：
*   **中文乱码**: 检查 `config/db.js` 中是否有 `charset: 'utf8mb4'`。
*   **跨域错误 (CORS)**: `server.js` 中已默认启用 `cors()` 中间件，通常无需配置。如遇问题请检查浏览器控制台。

---

## 🔮 5. 未来规划 (Roadmap)
*   [ ] **ORM 引入**: 考虑使用 Sequelize 替代原生 SQL，提高开发效率。
*   [ ] **用户系统**: 引入 JWT 鉴权，支持多用户登录。
*   [ ] **数据导出**: 实现后端直接生成 SQL 备份文件的功能。

