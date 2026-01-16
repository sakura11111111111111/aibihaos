# UI 修复方案：终极调整

根据自测结果和您的反馈，我制定了以下修复计划。

## 问题分析

### 1. 日历折叠失效
*   **根本原因**：Flatpickr 的 `inline` 模式会强制计算和设置元素的高度，或者通过 JS 直接操作样式，导致 CSS 中的 `max-height` 动画失效。而且，我怀疑 `calendar-wrapper` 的初始状态在 DOM 渲染时没有正确应用。
*   **修复方案**：
    *   **JS 强制干预**：在 `initializeTodoView` 中，Flatpickr 初始化完成后，立即检查折叠状态，并强制设置 `display` 样式。
    *   **CSS 增强**：使用 `display: none` 替代 `max-height: 0` 作为折叠态的核心样式。虽然没有动画，但能保证功能正常。如果非要动画，可以尝试 `transform: scaleY(0)`，但 `display: none` 最稳妥。

### 2. 红点不显示
*   **根本原因**：`flatpickr-day` 的定位上下文问题。Flatpickr 的日期元素内部结构比较复杂，简单的 `absolute` 定位可能被遮挡。
*   **修复方案**：
    *   **JS 注入修正**：不使用 `appendChild`，而是直接修改 `dayElem` 的 `innerHTML` 或者使用 Flatpickr 提供的 `onDayCreate` 钩子更严谨地插入。
    *   **CSS 调整**：将红点的位置调整为 `top: 2px; right: 2px;` 试试，避开底部可能存在的边距问题。并且给红点加上 `position: absolute !important`。

### 3. 按钮图标不显示
*   **根本原因**：虽然 `@fortawesome/fontawesome-free` 已安装且 CSS 已引入，但在 `src/styles/views/todo.css` 中我手动指定了 `font-family: "Font Awesome 5 Free"`，这可能与引入的版本（6.7.2）不匹配。FontAwesome 6 的字体名称是 `"Font Awesome 6 Free"`。
*   **修复方案**：
    *   **移除手动字体声明**：直接依赖 `fas` 类名自带的样式，不要画蛇添足地去重写 `font-family`。
    *   **检查类名**：FontAwesome 6 推荐使用 `fa-solid`，虽然 `fas` 也兼容，但为了保险，我们检查一下。

## 执行步骤

1.  **修改 `src/styles/views/todo.css`**:
    *   移除 `.review-btn i` 中的 `font-family` 强制声明。
    *   修改 `.calendar-wrapper.collapsed` 为 `display: none !important`。
    *   调整 `.event-dot` 的定位和层级。

2.  **修改 `src/views/todo.js`**:
    *   在日历初始化后，立即调用一次折叠状态检查。
    *   修正红点注入逻辑。

3.  **验证**：
    *   再次点击折叠按钮，确认日历消失。
    *   查看红点是否出现。
    *   确认按钮图标显示。
