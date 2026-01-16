# Git 分支说明文档

## 分支清单

| 分支名称 | 说明 | 状态 |
| :--- | :--- | :--- |
| **master** | 主分支，包含最新的稳定代码 (CSS 模块化重构完成) | 🟢 稳定 |
| **feature/todo-list-v2** | 待办事项功能开发 (V2版本，独立样式) | 🚀 开发中 (当前分支) |
| **yuanshi-beifen** | 原始备份分支，指向重构前的 Vanilla JS 版本 | 🔒 存档 (只读) |
| **gongneng-shujubeifen** | 旧功能分支 | ⚠️ 已废弃 |

## 版本历史

*   **feature/todo-list-v2**:
    *   `Feat: Add reschedule review date functionality` - 新增自定义调整复习日期功能，允许用户手动延后或修改计划
    *   `Fix: Resolve date offset bug in calendar` - 彻底修复日历红点与任务日期不一致的问题(时区偏差)，使用本地日期计算逻辑
    *   `Fix: Import missing todo.css and fix timezone logic` - 修复样式未加载导致的UI问题(日历折叠/图标/红点)，修复红点日期偏差
    *   `Fix: Restore navigation and modal styles` - 修复导航按钮点击无反应及弹窗样式丢失问题
    *   `Feat: Implement Todo list` - 实现待办事项功能

*   **master**:
    *   `Feat: Merge todo-list-v2` - 合并待办事项V2功能(日历视图、复习算法、UI优化)到主分支
    *   `Refactor: Modularize CSS architecture` - CSS 架构重构，拆分为模块化文件
    *   `Feat: Add data export/import for backup` - 新增数据导入导出功能
    *   `Refactor: Migrate to Vite and ES Modules` - 完成工程化重构
    *   `Initial commit` - 项目初始化

*   **yuanshi-beifen**:
    *   `Initial commit` - 原始代码备份

## 常用操作

### 切换分支
```bash
# 切换到开发分支
git checkout feature/todo-list-v2

# 切换到主分支
git checkout master
```

### 运行项目
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
