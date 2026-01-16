import Split from 'split.js';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';
import 'flatpickr/dist/flatpickr.min.css';
import { allNotes, saveNotes } from '../store.js';

// Setup flatpickr locale
if (Mandarin) {
    flatpickr.localize(Mandarin);
}

export function initializeTodoView() {
    // 1. 初始化两栏布局
    if (document.querySelector('#todo-list-panel')) {
        Split(['#todo-list-panel', '#todo-preview-panel'], { 
            sizes: [35, 65], 
            minSize: [320, 400], 
            gutterSize: 8, 
            cursor: 'col-resize' 
        });
    }

    // 2. 获取 DOM 元素
    const todoListContainer = document.getElementById('todo-list');
    const todoCountBadge = document.getElementById('todo-count');
    const todoDateTitle = document.getElementById('todo-date-title');
    const reviewTitle = document.getElementById('review-note-title');
    const reviewContent = document.getElementById('review-note-content');
    const reviewActionsFooter = document.querySelector('.review-actions');
    const currentStageSpan = document.getElementById('current-stage');
    const nextIntervalSpan = document.getElementById('next-interval');
    
    // 日历相关元素
    const calendarContainer = document.getElementById('todo-calendar-container');
    const calendarWrapper = document.getElementById('todo-calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    
    // 确保只获取当前视图内的 toggle-icon
    const toggleIcon = calendarHeader ? calendarHeader.querySelector('.toggle-icon') : null;

    // 复习按钮
    const forgetBtn = document.getElementById('review-forget-btn');
    const blurBtn = document.getElementById('review-blur-btn');
    const rememberBtn = document.getElementById('review-remember-btn');

    let currentSelectedNote = null;
    let currentSelectedDate = new Date().toISOString().split('T')[0]; // 默认为今天

    // 辅助函数：安全的日期加法 (避免时区问题)
    function addDays(dateStr, days) {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS Month is 0-indexed
        const day = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        date.setDate(date.getDate() + days);
        
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 辅助函数：计算一篇笔记的所有未来复习日期
    function calculateFutureReviewDates(note) {
        if (!note.review) return [];
        const modeId = note.review.modeId;
        const intervals = modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        const dates = [];
        
        // 基础日期：下次复习日期
        let currentDateStr = note.review.nextReviewDate;
        dates.push(currentDateStr);
        
        let currentIdx = note.review.currentIntervalIndex;
        // 预测未来的复习日期
        for (let i = currentIdx + 1; i < intervals.length; i++) {
            const intervalDays = intervals[i];
            // 注意：Ebbinghaus 间隔通常是相对于"上一次"复习的
            // 这里我们简单累加：下一次复习日期 + 下个阶段间隔
            currentDateStr = addDays(currentDateStr, intervalDays);
            dates.push(currentDateStr);
        }
        return dates;
    }

    // 3. 初始化日历
    if (calendarContainer) {
        const fp = flatpickr(calendarContainer, {
            inline: true,
            locale: "zh",
            defaultDate: currentSelectedDate,
            onChange: (selectedDates, dateStr) => {
                currentSelectedDate = dateStr;
                renderTodoList(); 
            },
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                // 手动构建日期字符串，确保与 addDays 逻辑一致，避免时区干扰
                const year = dayElem.dateObj.getFullYear();
                const month = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dayElem.dateObj.getDate()).padStart(2, '0');
                const date = `${year}-${month}-${day}`;
                
                const hasTask = allNotes.some(note => {
                    const futureDates = calculateFutureReviewDates(note);
                    return futureDates.includes(date);
                });
                
                if (hasTask) {
                    const dot = document.createElement('span');
                    dot.className = 'event-dot';
                    dayElem.appendChild(dot);
                    dayElem.classList.add('has-event');
                }
            }
        });

        // 强制同步折叠状态：Flatpickr 初始化后，如果 wrapper 有 collapsed 类，强制隐藏
        if (calendarWrapper && calendarWrapper.classList.contains('collapsed')) {
            calendarWrapper.style.display = 'none';
        }
    }

    // 日历折叠逻辑
    if (calendarHeader && calendarWrapper) {
        // 初始图标状态
        if (calendarWrapper.classList.contains('collapsed')) {
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
        }

        calendarHeader.addEventListener('click', () => {
            const isCollapsed = calendarWrapper.classList.contains('collapsed');
            
            if (isCollapsed) {
                // 展开
                calendarWrapper.classList.remove('collapsed');
                calendarWrapper.style.display = 'block'; // 显式显示
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
            } else {
                // 折叠
                calendarWrapper.classList.add('collapsed');
                calendarWrapper.style.display = 'none'; // 显式隐藏
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
            }
        });
    }

    // 4. 渲染任务列表
    function renderTodoList() {
        const today = new Date().toISOString().split('T')[0];
        const isToday = currentSelectedDate === today;
        todoDateTitle.textContent = isToday ? '今日复习任务' : `${currentSelectedDate} 的复习任务`;

        const reviewTasks = allNotes.filter(note => {
            if (!note.review) return false;
            if (isToday) return note.review.nextReviewDate <= today;
            const futureDates = calculateFutureReviewDates(note);
            return futureDates.includes(currentSelectedDate);
        });

        todoCountBadge.textContent = reviewTasks.length;
        
        if (reviewTasks.length === 0) {
            todoListContainer.innerHTML = `
                <div class="empty-state-list">
                    <i class="fas fa-mug-hot"></i>
                    <p>${isToday ? '太棒了！今日复习任务已全部完成。' : '这一天暂时没有复习计划。'}</p>
                </div>`;
            return;
        }

        todoListContainer.innerHTML = reviewTasks.map(note => `
            <li class="todo-item" data-id="${note.id}">
                <div class="todo-item-content">
                    <span class="todo-title">${note.title || '无标题笔记'}</span>
                    <span class="todo-meta">
                        <i class="fas fa-clock"></i> 计划日期: ${note.review.nextReviewDate}
                    </span>
                </div>
                <i class="fas fa-chevron-right arrow-icon"></i>
            </li>
        `).join('');
    }

    renderTodoList();

    // 5. 列表点击事件
    todoListContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        document.querySelectorAll('.todo-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');

        const noteId = parseInt(item.dataset.id);
        currentSelectedNote = allNotes.find(n => n.id === noteId);
        
        if (currentSelectedNote) {
            renderReviewPreview(currentSelectedNote);
        }
    });

    // 6. 渲染右侧预览
    function renderReviewPreview(note) {
        reviewTitle.textContent = note.title;
        const contentHtml = note.blocks.map(b => b.content).join('');
        reviewContent.innerHTML = contentHtml;
        reviewContent.scrollTop = 0;

        const modeId = note.review.modeId;
        const currentIdx = note.review.currentIntervalIndex;
        const intervals = modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        
        // 计算下一个正常的间隔（用于"记住"按钮提示）
        const nextIdx = currentIdx + 1;
        const nextIntervalDays = nextIdx < intervals.length ? intervals[nextIdx] : 0;
        
        reviewActionsFooter.style.display = 'flex';
        currentStageSpan.textContent = `第${currentIdx + 1}阶段`;
        
        // 更新文案提示
        if (nextIdx >= intervals.length) {
            nextIntervalSpan.textContent = "即将归档";
        } else {
            nextIntervalSpan.textContent = `${nextIntervalDays}天后`;
        }
    }

    // 7. 处理复习逻辑
    async function handleReview(action) {
        if (!currentSelectedNote) return;

        // 预览模式下禁止操作
        const today = new Date().toISOString().split('T')[0];
        if (currentSelectedDate > today) {
            await Swal.fire({ icon: 'info', title: '预览模式', text: '这是未来的任务，请等到那天再来打卡！' });
            return;
        }

        const intervals = currentSelectedNote.review.modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        let nextIdx = currentSelectedNote.review.currentIntervalIndex;
        let nextDateOffset = 1; // 默认明天
        let message = '';

        // 核心算法
        switch (action) {
            case 'forget': // 忘记 -> 重置到起点，明天复习
                nextIdx = 0;
                nextDateOffset = 1;
                message = '没关系，重新开始巩固！';
                break;
            case 'blur': // 模糊 -> 保持当前进度，明天强化
                // nextIdx 不变
                nextDateOffset = 1;
                message = '已安排明天强化复习！';
                break;
            case 'remember': // 记住 -> 正常推进
                nextIdx++;
                if (nextIdx < intervals.length) {
                    nextDateOffset = intervals[nextIdx];
                }
                message = '太棒了！记忆加深了！';
                break;
        }

        // 归档判断
        if (action === 'remember' && nextIdx >= intervals.length) {
            currentSelectedNote.review = null;
            await Swal.fire({ icon: 'success', title: '恭喜！', text: '这篇笔记已完成所有复习计划！', timer: 1500, showConfirmButton: false });
        } else {
            // 更新下次时间
            const todayDate = new Date();
            todayDate.setDate(todayDate.getDate() + nextDateOffset);
            
            currentSelectedNote.review.currentIntervalIndex = nextIdx;
            currentSelectedNote.review.nextReviewDate = todayDate.toISOString().split('T')[0];
            currentSelectedNote.review.lastReviewDate = today;

            await Swal.fire({ icon: 'success', title: '打卡成功', text: message, timer: 1000, showConfirmButton: false });
        }

        saveNotes();
        renderTodoList();
        
        // 重置界面
        reviewTitle.textContent = "请选择一个任务开始复习";
        reviewContent.innerHTML = `<div class="empty-state"><i class="fas fa-book-reader"></i><p>点击左侧任务，开始沉浸式复习</p></div>`;
        reviewActionsFooter.style.display = 'none';
        currentSelectedNote = null;
    }

    // 绑定按钮事件
    if (forgetBtn) forgetBtn.addEventListener('click', () => handleReview('forget'));
    if (blurBtn) blurBtn.addEventListener('click', () => handleReview('blur'));
    if (rememberBtn) rememberBtn.addEventListener('click', () => handleReview('remember'));
}
