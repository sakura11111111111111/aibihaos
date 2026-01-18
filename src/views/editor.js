import Quill from 'quill';
import Split from 'split.js';
import flatpickr from 'flatpickr';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';
import Sortable from 'sortablejs';
import Swal from 'sweetalert2';
import 'quill/dist/quill.snow.css';
import 'flatpickr/dist/flatpickr.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { categories, allNotes, saveSingleNote, loadNotes, reviewModes, addReviewMode, deleteReviewMode } from '../store.js';
import { findCategoryById } from '../utils.js';
import { buildCategoryTreeHTML } from '../components.js';

// Setup flatpickr locale
if (Mandarin) {
    flatpickr.localize(Mandarin);
}

export async function initializeEditor() {
    // --- 1. 模式判断与状态初始化 ---
    let isEditMode = false;
    let editingNoteId = null;
    
    const noteIdToEdit = sessionStorage.getItem('noteToEditId');
    if (noteIdToEdit) {
        isEditMode = true;
        editingNoteId = parseInt(noteIdToEdit);
        sessionStorage.removeItem('noteToEditId'); // 阅后即焚
    }

    // --- 2. 获取元素 ---
    const titleInput = document.querySelector('.title-input');
    const dateDisplay = document.getElementById('date-display');
    const categoryTagContainer = document.getElementById('selected-category-tag');
    const reviewModeTagContainer = document.getElementById('selected-review-mode-tag');
    const archiveBtn = document.getElementById('archive-btn');
    const reviewModeBtn = document.getElementById('review-mode-btn');
    const previewBlocksContainer = document.getElementById('preview-content-blocks');
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const completeEditBtn = document.getElementById('complete-edit-btn');
    const datePickerBtn = document.getElementById('date-picker-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');

    // --- 3. 库的初始化 ---
    if (document.querySelector('#editor-panel')) {
         Split(['#editor-panel', '#preview-panel'], { sizes: [55, 45], minSize: 350, gutterSize: 8, cursor: 'col-resize' });
    }
   
    let mainQuill;
    if (document.getElementById('editor-container')) {
        mainQuill = new Quill('#editor-container', { 
            modules: { toolbar: [['bold', 'italic', 'underline'],['blockquote'],[{ 'header': 1 }, { 'header': 2 }], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] }, 
            placeholder: '在这里插入内容...', 
            theme: 'snow' 
        });
    }

    // --- 4. 状态变量初始化 ---
    let noteBlocks = []
    let selectedDate = null;
    let selectedCategoryId = null;
    let selectedReviewModeId = null;

    // Refresh notes from store
    await loadNotes();

    // ★★★ 核心修正：将数据回填逻辑放在所有变量定义之后 ★★★ 
    if (isEditMode) { 
        // Use imported allNotes
        const noteToEdit = allNotes.find(note => note.id === editingNoteId); 

        if (noteToEdit) { 
            // 回填状态变量 
            noteBlocks = noteToEdit.blocks || []; 
            selectedDate = noteToEdit.creationDate; 
            selectedCategoryId = noteToEdit.categoryId; 
            if (noteToEdit.review) { 
                selectedReviewModeId = noteToEdit.review.modeId; 
            } 

            // 回填UI 
            if (titleInput) titleInput.value = noteToEdit.title; 
            if (dateDisplay) dateDisplay.textContent = `创建日期: ${selectedDate}`; 
            
            const category = findCategoryById(selectedCategoryId, categories); 
            if(category && categoryTagContainer) { 
                categoryTagContainer.innerHTML = `<span>${category.name}</span><button class="tag-close-btn" title="清除选择">&times;</button>`; 
                archiveBtn.classList.add('selected'); 
            } 

            if (selectedReviewModeId) { 
                const mode = reviewModes.find(m => m.id === selectedReviewModeId);
                if(mode && reviewModeTagContainer) { 
                   reviewModeTagContainer.innerHTML = `<span>${mode.name}</span><button class="tag-close-btn" title="清除选择">&times;</button>`; 
                   reviewModeBtn.classList.add('selected'); 
                } 
            } 
        } 
    }

    // --- 5. 依赖于数据的库初始化和初次渲染 ---
    let flatpickrInstance = null;
    if (datePickerBtn) {
        flatpickrInstance = flatpickr(datePickerBtn, {
            dateFormat: "Y-m-d",
            locale: "zh",
            defaultDate: selectedDate, // 使用已加载的日期
            onChange: (selectedDates, dateStr) => {
                if (dateDisplay) dateDisplay.textContent = `创建日期: ${dateStr}`;
                selectedDate = dateStr;
            }
        });
    }

    renderBlocks(); // 初次渲染笔记块

    // --- 6. 内部函数定义 ---
    // Removed local reviewModes definition, using store instead.

    if (previewBlocksContainer) {
        new Sortable(previewBlocksContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.note-block',
            onEnd: function (evt) {
                const newOrder = Array.from(previewBlocksContainer.children).map(el => {
                    const id = parseInt(el.getAttribute('data-id'));
                    return noteBlocks.find(b => b.id === id);
                });
                noteBlocks = newOrder.filter(Boolean);
            },
        });
    }
    
    function renderBlocks() {
        if (!previewBlocksContainer) return;
        previewBlocksContainer.innerHTML = '';
        noteBlocks.forEach(block => {
            const blockEl = document.createElement('div');
            blockEl.className = 'note-block';
            blockEl.setAttribute('data-id', block.id);
            blockEl.innerHTML = `<div class="block-content ql-editor">${block.content}</div><div class="block-actions"><button class="edit-btn tooltip" data-tooltip="编辑"><i class="fas fa-pen"></i></button><button class="delete-btn tooltip" data-tooltip="删除"><i class="fas fa-trash"></i></button></div>`;
            previewBlocksContainer.appendChild(blockEl);
        });
        if(previewPlaceholder) {
            previewPlaceholder.style.display = noteBlocks.length === 0 ? 'block' : 'none';
        }
    }

    // --- 7. 内部函数定义 (Removed findReviewModeById as we use store now) ---

    // 辅助：从 store 中查找 mode (如果还需要局部查找)
    // function findReviewModeById(id) {
    //    return reviewModes.find(mode => mode.id === id) || null;
    // }

    if (completeEditBtn) { 
        completeEditBtn.addEventListener('click', () => { 
            const newContent = mainQuill.root.innerHTML; 
            if (mainQuill.getLength() <= 1 || newContent.trim() === "<p><br></p>") return; 
            noteBlocks.push({ id: Date.now(), content: newContent }); 
            mainQuill.setText(''); 
            renderBlocks(); 
        }); 
    }
    
    if (archiveBtn) { 
        archiveBtn.addEventListener('click', async () => { 
            if (!selectedDate) { 
                Swal.fire({ icon: 'error', title: '操作失败', text: '在归档前，请先选择一个创建日期！' }); 
                return; 
            } 
            const { value: categoryId } = await Swal.fire({ 
                title: '选择归档类别', 
                html: `<div class="category-modal-header"><button id="add-new-category-btn" class="action-btn"><i class="fas fa-plus"></i> 新增顶级类别</button></div><div id="category-tree-container">${buildCategoryTreeHTML(categories)}</div>`, 
                width: '600px', showCancelButton: true, confirmButtonText: '✓ 归档到此', cancelButtonText: '取消', 
                didOpen: () => { 
                    const container = document.getElementById('category-tree-container'); 
                    container.addEventListener('click', (e) => { 
                        const itemEl = e.target.closest('.tree-item'); 
                        if (!itemEl) return; 
                        container.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected')); 
                        itemEl.classList.add('selected'); 
                    }); 
                    document.getElementById('add-new-category-btn').addEventListener('click', () => alert('新增顶级分类功能待实现')); 
                }, 
                preConfirm: () => { 
                    const selectedEl = document.querySelector('#category-tree-container .tree-item.selected'); 
                    if (!selectedEl) { Swal.showValidationMessage('请选择一个要归档的类别'); return null; } 
                    return selectedEl.dataset.id; 
                } 
            }); 

            if (categoryId) { 
                selectedCategoryId = parseInt(categoryId); 
                const category = findCategoryById(selectedCategoryId, categories); 
                const categoryName = category ? category.name : '未知分类'; 
                const tagContainer = document.getElementById('selected-category-tag'); 
                tagContainer.innerHTML = `<span>${categoryName}</span><button class="tag-close-btn" title="清除选择">&times;</button>`; 
                archiveBtn.classList.add('selected'); 
                tagContainer.querySelector('.tag-close-btn').addEventListener('click', () => { 
                    selectedCategoryId = null; 
                    tagContainer.innerHTML = ''; 
                    archiveBtn.classList.remove('selected'); 
                }); 
            } 
        }); 
    }

    if (reviewModeBtn) { 
        reviewModeBtn.addEventListener('click', async () => { 
             const buildReviewModeListHTML = () => { 
                let html = '<ul class="review-mode-list">'; 
                reviewModes.forEach(mode => { html += `<li class="review-mode-item" data-id="${mode.id}"><span class="item-name">${mode.name}</span><span class="item-detail">${mode.isSystem ? '系统推荐' : '自定义'}</span></li>`; }); 
                html += '</ul>'; 
                return html; 
            }; 
            const { value: modeId } = await Swal.fire({ 
                title: '选择复习模式', 
                html: `<div class="review-modal-header"><a href="#" id="manage-review-modes-link">管理我的模式 ></a></div><div id="review-mode-list-container">${buildReviewModeListHTML()}</div>`, 
                width: '500px', showCancelButton: true, confirmButtonText: '✓ 选择此模式', cancelButtonText: '取消', 
                didOpen: () => { 
                    const container = document.getElementById('review-mode-list-container'); 
                    container.addEventListener('click', (e) => { 
                        const itemEl = e.target.closest('.review-mode-item'); 
                        if (!itemEl) return; 
                        container.querySelectorAll('.review-mode-item').forEach(el => el.classList.remove('selected')); 
                        itemEl.classList.add('selected'); 
                    }); 
                    document.getElementById('manage-review-modes-link').addEventListener('click', (e) => { 
                        e.preventDefault(); 
                        showManageReviewModesModal(); 
                    }); 
                }, 
                preConfirm: () => { 
                    const selectedEl = document.querySelector('#review-mode-list-container .review-mode-item.selected'); 
                    if (!selectedEl) { Swal.showValidationMessage('请选择一个复习模式'); return null; } 
                    return selectedEl.dataset.id; 
                } 
            }); 

            if (modeId) { 
                selectedReviewModeId = modeId; 
                // Using store function
                const mode = reviewModes.find(m => m.id === selectedReviewModeId);
                const modeName = mode ? mode.name : '未知模式'; 
                const tagContainer = document.getElementById('selected-review-mode-tag'); 
                tagContainer.innerHTML = `<span>${modeName}</span><button class="tag-close-btn" title="清除选择">&times;</button>`; 
                reviewModeBtn.classList.add('selected'); 
                tagContainer.querySelector('.tag-close-btn').addEventListener('click', () => { 
                    selectedReviewModeId = null; 
                    tagContainer.innerHTML = ''; 
                    reviewModeBtn.classList.remove('selected'); 
                }); 
            } 
        }); 
    }

    // --- 新增：管理复习模式弹窗 ---
    async function showManageReviewModesModal() {
        const buildManageListHTML = () => {
            let html = '<div class="manage-mode-list" style="max-height: 300px; overflow-y: auto; text-align: left;">';
            reviewModes.forEach(mode => {
                html += `
                <div class="manage-mode-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <div>
                        <div style="font-weight: bold;">${mode.name}</div>
                        <div style="font-size: 12px; color: #666;">${mode.description}</div>
                        <div style="font-size: 12px; color: #999;">间隔: ${mode.intervals.join(', ')}</div>
                    </div>
                    ${!mode.isSystem ? `<button class="delete-mode-btn" data-id="${mode.id}" style="color: #f56c6c; border: none; background: none; cursor: pointer;"><i class="fas fa-trash"></i></button>` : '<span style="font-size: 12px; color: #999;">系统内置</span>'}
                </div>`;
            });
            html += '</div>';
            return html;
        };

        await Swal.fire({
            title: '管理复习模式',
            html: `
                ${buildManageListHTML()}
                <button id="add-new-mode-btn" class="swal2-confirm swal2-styled" style="background-color: #67c23a; margin-top: 15px; width: 100%;">+ 新增自定义模式</button>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                // 绑定删除事件
                const container = Swal.getHtmlContainer();
                container.querySelectorAll('.delete-mode-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.dataset.id;
                        Swal.fire({
                            title: '确认删除?',
                            text: "删除后无法恢复，且使用该模式的旧笔记可能受影响。",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: '删除',
                            cancelButtonText: '取消'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                if (deleteReviewMode(id)) {
                                    Swal.fire('已删除', '', 'success').then(() => showManageReviewModesModal());
                                }
                            }
                        });
                    });
                });

                // 绑定新增事件
                document.getElementById('add-new-mode-btn').addEventListener('click', async () => {
                    const { value: formValues } = await Swal.fire({
                        title: '创建新模式',
                        html: `
                            <input id="swal-mode-name" class="swal2-input" placeholder="模式名称 (如: 考研冲刺)">
                            <input id="swal-mode-intervals" class="swal2-input" placeholder="复习间隔 (如: 1,2,4,7)">
                            <div style="font-size: 12px; color: #666; text-align: left; margin-top: 5px;">
                                * 请输入以逗号分隔的数字，表示每次复习距离上一次的天数。<br>
                                例如 "1, 2, 5" 表示：<br>
                                第1次: 1天后<br>
                                第2次: 再过2天 (总第3天)<br>
                                第3次: 再过5天 (总第8天)
                            </div>
                        `,
                        focusConfirm: false,
                        showCancelButton: true,
                        preConfirm: () => {
                            const name = document.getElementById('swal-mode-name').value;
                            const intervalsStr = document.getElementById('swal-mode-intervals').value;
                            
                            if (!name || !intervalsStr) {
                                Swal.showValidationMessage('请填写完整信息');
                                return false;
                            }
                            
                            // 简单的验证和解析
                            const intervals = intervalsStr.split(/[,，]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                            
                            if (intervals.length === 0) {
                                Swal.showValidationMessage('请输入有效的数字间隔');
                                return false;
                            }
                            
                            return { name, intervals };
                        }
                    });

                    if (formValues) {
                        addReviewMode(formValues.name, formValues.intervals);
                        Swal.fire('创建成功', '', 'success').then(() => showManageReviewModesModal());
                    }
                });
            }
        });
    }

    if (saveNoteBtn) { 
        saveNoteBtn.addEventListener('click', async () => { 
            const title = titleInput.value.trim(); 
            
            // 校验逻辑 
            if (!selectedDate || !selectedCategoryId) { Swal.fire('操作无效', '请先选择日期和归档分类。', 'warning'); return; } 
            if (!title && noteBlocks.length === 0) { Swal.fire('操作无效', '笔记的标题和内容不能都为空。', 'warning'); return; } 
            
            // 组装笔记对象，关键：ID根据模式来决定 
            const finalNoteObject = { 
                id: isEditMode ? editingNoteId : Date.now(), 
                title, 
                creationDate: selectedDate, 
                categoryId: selectedCategoryId, 
                blocks: noteBlocks, 
                review: null 
            }; 

            if (selectedReviewModeId) { 
                const mode = reviewModes.find(m => m.id === selectedReviewModeId);
                if (mode && mode.intervals.length > 0) { 
                    const addDaysAndFormat = (d, days) => { const date = new Date(d); date.setDate(date.getDate() + days); return date.toISOString().split('T')[0]; }; 
                    finalNoteObject.review = { modeId: selectedReviewModeId, currentIntervalIndex: 0, nextReviewDate: addDaysAndFormat(selectedDate, mode.intervals[0]), lastReviewDate: null }; 
                } 
            } 
            
            // 核心：区分 新增 和 更新 逻辑 
            // 注意：这里我们不再直接操作数组，而是调用 store 的 saveSingleNote 方法
            // 该方法会负责调用 API
            
            try {
                const success = await saveSingleNote(finalNoteObject);
                if (success) {
                    Swal.fire({ icon: 'success', title: isEditMode ? '笔记已更新！' : '笔记已存储！', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 }); 
                    
                    // 保存后，跳转回"所有笔记"页面，以便看到更新 
                    const allNotesBtn = document.getElementById('all-notes-btn');
                    if (allNotesBtn) allNotesBtn.click(); 
                } else {
                    Swal.fire('保存失败', '无法连接到服务器，请重试。', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('保存失败', '发生未知错误。', 'error');
            }
        }); 
    }
}
