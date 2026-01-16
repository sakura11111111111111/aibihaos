import Split from 'split.js';
import Swal from 'sweetalert2';
import { allNotes, saveNotes } from '../store.js';

export function initializeTodoView() {
    // 1. 初始化两栏布局
    if (document.querySelector('#todo-list-panel')) {
        Split(['#todo-list-panel', '#todo-preview-panel'], { 
            sizes: [30, 70], 
            minSize: [300, 400], 
            gutterSize: 8, 
            cursor: 'col-resize' 
        });
    }

    // 2. 获取 DOM 元素
    const todoListContainer = document.getElementById('todo-list');
    const todoCountBadge = document.getElementById('todo-count');
    const reviewTitle = document.getElementById('review-note-title');
    const reviewContent = document.getElementById('review-note-content');
    const reviewActionsFooter = document.querySelector('.review-actions');
    const currentStageSpan = document.getElementById('current-stage');
    const nextIntervalSpan = document.getElementById('next-interval');
    const completeReviewBtn = document.getElementById('complete-review-btn');

    let currentSelectedNote = null;

    // 3. 筛选今日复习任务
    const today = new Date().toISOString().split('T')[0];
    
    // 筛选逻辑：有复习计划 且 (下次复习日期 <= 今天)
    const reviewTasks = allNotes.filter(note => {
        if (!note.review) return false;
        return note.review.nextReviewDate <= today;
    });

    // 4. 渲染任务列表
    renderTodoList();

    function renderTodoList() {
        todoCountBadge.textContent = reviewTasks.length;
        
        if (reviewTasks.length === 0) {
            todoListContainer.innerHTML = `
                <div class="empty-state-list">
                    <i class="fas fa-mug-hot"></i>
                    <p>太棒了！今日复习任务已全部完成。</p>
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

    // 5. 事件监听：点击任务
    todoListContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        // 高亮选中状态
        document.querySelectorAll('.todo-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');

        // 获取笔记数据
        const noteId = parseInt(item.dataset.id);
        currentSelectedNote = allNotes.find(n => n.id === noteId);
        
        if (currentSelectedNote) {
            renderReviewPreview(currentSelectedNote);
        }
    });

    // 6. 渲染右侧预览
    function renderReviewPreview(note) {
        reviewTitle.textContent = note.title;
        
        // 渲染内容 (复用 Quill 的样式类 ql-editor)
        const contentHtml = note.blocks.map(b => b.content).join('');
        reviewContent.innerHTML = contentHtml;
        reviewContent.scrollTop = 0; // 回到顶部

        // 计算下一次复习信息
        const modeId = note.review.modeId;
        const currentIdx = note.review.currentIntervalIndex;
        // 简单的复习策略字典 (应该从统一配置读取，这里先硬编码)
        const intervals = modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        
        const nextIdx = currentIdx + 1;
        const isLastStage = nextIdx >= intervals.length;
        
        // 更新底部操作栏
        reviewActionsFooter.style.display = 'flex';
        currentStageSpan.textContent = `第${currentIdx + 1}阶段`;
        
        if (isLastStage) {
            nextIntervalSpan.textContent = "已完成所有复习！";
            completeReviewBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> 归档并结束复习';
        } else {
            const days = intervals[nextIdx];
            nextIntervalSpan.textContent = `${days}天后`;
            completeReviewBtn.innerHTML = '<i class="fas fa-check"></i> 完成今日复习';
        }
    }

    // 7. 事件监听：完成复习
    completeReviewBtn.addEventListener('click', async () => {
        if (!currentSelectedNote) return;

        // 动画反馈
        await Swal.fire({
            icon: 'success',
            title: '复习完成！',
            text: '记忆加深了一点点~',
            timer: 1000,
            showConfirmButton: false
        });

        // 更新逻辑
        const intervals = currentSelectedNote.review.modeId === 'custom_weekly' ? [7, 14, 21, 28] : [1, 2, 4, 7, 15, 30];
        const nextIdx = currentSelectedNote.review.currentIntervalIndex + 1;

        if (nextIdx >= intervals.length) {
            // 复习周期结束，移除复习属性或标记为完成
            currentSelectedNote.review = null; 
        } else {
            // 更新下次时间
            const todayDate = new Date();
            const nextIntervalDays = intervals[nextIdx];
            todayDate.setDate(todayDate.getDate() + nextIntervalDays);
            
            currentSelectedNote.review.currentIntervalIndex = nextIdx;
            currentSelectedNote.review.nextReviewDate = todayDate.toISOString().split('T')[0];
            currentSelectedNote.review.lastReviewDate = today;
        }

        // 保存数据
        saveNotes();

        // 从当前列表中移除
        const index = reviewTasks.findIndex(n => n.id === currentSelectedNote.id);
        if (index > -1) {
            reviewTasks.splice(index, 1);
        }

        // 刷新 UI
        renderTodoList();
        
        // 重置右侧
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
