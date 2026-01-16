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
            sizes: [35, 65], // 调整比例，给日历多一点空间
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
    const completeReviewBtn = document.getElementById('complete-review-btn');
    const calendarContainer = document.getElementById('todo-calendar-container');

    let currentSelectedNote = null;
    let currentSelectedDate = new Date().toISOString().split('T')[0]; // 默认为今天

    // 3. 初始化日历
    if (calendarContainer) {
        flatpickr(calendarContainer, {
            inline: true, // 内联显示，不作为弹窗
            locale: "zh",
            defaultDate: currentSelectedDate,
            onChange: (selectedDates, dateStr) => {
                currentSelectedDate = dateStr;
                renderTodoList(); // 日期改变时刷新列表
            },
            // 进阶：标记有任务的日期
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                const date = dayElem.dateObj.toISOString().split('T')[0];
                const hasTask = allNotes.some(note => 
                    note.review && note.review.nextReviewDate === date
                );
                
                if (hasTask) {
                    dayElem.innerHTML += "<span class='event-dot'></span>";
                    dayElem.classList.add('has-event');
                }
            }
        });
    }

    // 4. 渲染任务列表 (核心逻辑)
    function renderTodoList() {
        const today = new Date().toISOString().split('T')[0];
        const isToday = currentSelectedDate === today;
        
        // 更新标题
        todoDateTitle.textContent = isToday ? '今日复习任务' : `${currentSelectedDate} 的复习任务`;

        // 筛选逻辑：精准匹配选中的日期
        // 注意：之前的逻辑是 <= today，现在改为 === currentSelectedDate
        // 这样可以查看未来某一天的具体任务
        const reviewTasks = allNotes.filter(note => {
            if (!note.review) return false;
            // 如果是今天，可以包含之前漏掉的（过期任务）
            if (isToday) {
                return note.review.nextReviewDate <= today;
            }
            // 如果是未来日期，只显示那一天到期的
            return note.review.nextReviewDate === currentSelectedDate;
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

    // 初始渲染
    renderTodoList();

    // 5. 事件监听：点击任务 (复用之前的逻辑)
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

    // 6. 渲染右侧预览 (复用之前的逻辑)
    function renderReviewPreview(note) {
        reviewTitle.textContent = note.title;
        const contentHtml = note.blocks.map(b => b.content).join('');
        reviewContent.innerHTML = contentHtml;
        reviewContent.scrollTop = 0;

        const modeId = note.review.modeId;
        const currentIdx = note.review.currentIntervalIndex;
        const intervals = modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        const nextIdx = currentIdx + 1;
        const isLastStage = nextIdx >= intervals.length;
        
        reviewActionsFooter.style.display = 'flex';
        currentStageSpan.textContent = `第${currentIdx + 1}阶段`;
        
        if (isLastStage) {
            nextIntervalSpan.textContent = "已完成所有复习！";
            completeReviewBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> 归档并结束复习';
        } else {
            const days = intervals[nextIdx];
            nextIntervalSpan.textContent = `${days}天后`;
            completeReviewBtn.innerHTML = '<i class="fas fa-check"></i> 完成复习';
        }
    }

    // 7. 事件监听：完成复习
    completeReviewBtn.addEventListener('click', async () => {
        if (!currentSelectedNote) return;

        await Swal.fire({
            icon: 'success',
            title: '复习完成！',
            text: '记忆加深了一点点~',
            timer: 1000,
            showConfirmButton: false
        });

        const intervals = currentSelectedNote.review.modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        const nextIdx = currentSelectedNote.review.currentIntervalIndex + 1;

        if (nextIdx >= intervals.length) {
            currentSelectedNote.review = null; 
        } else {
            const todayDate = new Date(); // 完成复习的时间基准是“今天”
            const nextIntervalDays = intervals[nextIdx];
            todayDate.setDate(todayDate.getDate() + nextIntervalDays);
            
            currentSelectedNote.review.currentIntervalIndex = nextIdx;
            currentSelectedNote.review.nextReviewDate = todayDate.toISOString().split('T')[0];
            currentSelectedNote.review.lastReviewDate = new Date().toISOString().split('T')[0];
        }

        saveNotes();
        renderTodoList(); // 重新刷新列表，任务应该会消失（因为日期变了）
        
        reviewTitle.textContent = "请选择一个任务开始复习";
        reviewContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-reader"></i>
                <p>点击左侧任务，开始沉浸式复习</p>
            </div>`;
        reviewActionsFooter.style.display = 'none';
        currentSelectedNote = null;
    });
}
