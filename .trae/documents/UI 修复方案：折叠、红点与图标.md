# UI 修复方案：折叠、红点与图标

非常抱歉之前的实现有遗漏，导致效果不符合预期。经过排查，我定位到了以下三个问题的根源，并制定了修复计划。

## 问题分析与修复

### 1. 日历默认展开且无法折叠
*   **原因**：
    *   在 `todo.js` 中，我为 `toggleCalendarBtn` 绑定了点击事件，但是事件监听器绑定在 `initializeTodoView` 函数内部。
    *   **关键错误**：HTML 结构中，`h2` 标签上的 ID 是 `toggle-calendar-btn`，但在 JS 中获取的变量名也是 `toggleCalendarBtn`，这看似没问题。
    *   但是！日历容器 `#todo-calendar-container` 是被 Flatpickr 初始化的。Flatpickr 初始化时可能会修改 DOM 结构，或者 `calendarWrapper` 的初始类名 `collapsed` 没有生效，因为 CSS 中的 `.calendar-wrapper` 样式可能被其他样式覆盖或者没有正确加载。
    *   **更重要的原因**：Flatpickr 的 `inline: true` 模式会直接在容器内生成日历。如果容器高度被限制为 0，日历确实看不见。但如果 CSS 没生效，它就会显示出来。

*   **修复**：
    *   确保 CSS 中 `.calendar-wrapper.collapsed` 的 `max-height: 0` 具有最高优先级（加上 `!important` 也没关系）。
    *   **JS 逻辑修正**：确保点击事件能正确切换 `collapsed` 类名。
    *   **默认状态**：在 HTML 中 `calendar-wrapper` 已经加了 `collapsed` 类，说明 CSS 加载有问题或者被覆盖。

### 2. 红点不显示
*   **原因**：
    *   `flatpickr` 的日期单元格 `.flatpickr-day` 默认有 `overflow: hidden` 或者类似的属性，导致绝对定位在底部的红点被切掉了。
    *   虽然我在 CSS 中加了 `overflow: visible !important`，但可能因为 CSS 加载顺序问题，或者 `flatpickr.min.css` 在 `main.js` 中引入的顺序晚于 `todo.css`，导致样式被覆盖。

*   **修复**：
    *   提高自定义 CSS 的优先级。
    *   确保红点的 `z-index` 足够高。

### 3. 按钮图标不显示 (只看到简陋文字)
*   **原因**：
    *   HTML 中使用了 `<i class="fas fa-times"></i>` 等 FontAwesome 图标。
    *   如果只看到文字，说明 **FontAwesome 字体文件没有正确加载**。
    *   在 `main.js` 中，我们引入了 `'@fortawesome/fontawesome-free/css/all.min.css'`。
    *   **可能原因**：Vite 在处理字体文件路径时可能出了问题，或者 CSS 虽然引入了，但字体文件没打包进去。
    *   **另一种可能**：按钮的 `display: flex` 样式没生效，导致图标和文字挤在一起或者图标被隐藏。

## 执行计划

1.  **CSS 强力修复 (`src/styles/views/todo.css`)**:
    *   给 `.calendar-wrapper.collapsed` 加上 `display: none` 而不仅仅是 `max-height: 0`，以确保它彻底隐藏（虽然动画会牺牲一点，但功能优先）。或者修复 `max-height` 动画逻辑。
    *   给 `.flatpickr-day` 加上更强的 `overflow: visible`。
    *   确保按钮样式的 `font-family` 包含 FontAwesome。

2.  **JS 逻辑检查 (`src/views/todo.js`)**:
    *   在 `initializeTodoView` 中添加 `console.log` 调试，确保点击事件真的触发了。
    *   修正折叠逻辑：如果日历被初始化了，确保它的容器能响应折叠。

3.  **HTML 微调**:
    *   确保 ID 拼写无误。

为了保险起见，我将采用 **“JS 强制控制”** 的策略来修复折叠问题，并优化 CSS 优先级来修复红点和图标。
