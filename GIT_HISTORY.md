# Git 分支说明文档

## 分支清单

| 分支名称 | 说明 | 状态 |
| :--- | :--- | :--- |
| **master** | 主分支，包含最新的稳定代码 (Vite 重构 + 设置备份功能) | 🟢 当前分支 |
| **yuanshi-beifen** | 原始备份分支，指向重构前的 Vanilla JS 版本 | 🔒 存档 (只读) |
| **gongneng-shujubeifen** | 功能开发分支 (数据备份功能 + 待办事项尝试) | ⚠️ 已废弃 (样式回退) |

## 版本历史

*   **master**:
    *   `Feat: Add data export/import for backup` - 新增数据导入导出功能 (当前稳定版)
    *   `Refactor: Migrate to Vite and ES Modules` - 完成工程化重构
    *   `Initial commit` - 项目初始化

*   **yuanshi-beifen**:
    *   `Initial commit` - 原始代码备份

## 常用操作

### 切换分支
```bash
# 切换到主分支
git checkout master

# 查看原始代码 (警告: 会覆盖当前文件，建议先提交或暂存)
git checkout yuanshi-beifen
```

### 运行项目
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
