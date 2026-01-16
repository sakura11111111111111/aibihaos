document.addEventListener('DOMContentLoaded', function () {
    const appContainer = document.getElementById('app-container');
    const homeBtn = document.getElementById('home-btn');
    const createNoteBtn = document.getElementById('create-note-btn');
    const allNotesBtn = document.getElementById('all-notes-btn');

    // ==================== 全局常量与数据存储 ====================
    const APP_NOTES_STORAGE_KEY = 'my-notes-app-data';
    const APP_CATEGORIES_STORAGE_KEY = 'my-notes-app-categories';

    // --- 重点：修正顺序 ---
    // 1. 先定义所有需要被全局调用的函数

    /**
     * 加载函数：从 localStorage 加载 categories，如果不存在则使用默认数据
     */
    function loadCategories() {
        const storedCategories = localStorage.getItem(APP_CATEGORIES_STORAGE_KEY);
        if (storedCategories) {
            return JSON.parse(storedCategories);
        } else {
            // 如果 localStorage 中没有，则返回我们的初始模拟数据
            return [
                { id: 1, name: '高数冲刺', children: [ { id: 11, name: '多元函数', children: [] } ] },
                { id: 2, name: '二重积分', children: [] },
                { id: 3, name: '大营销项目', children: [] }
            ];
        }
    }

    /**
     * 保存函数：将当前的 categories 数组保存到 localStorage
     */
    function saveCategories() {
        localStorage.setItem(APP_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    }

    /**
     * 递归函数：根据数据构建分类树的 HTML (全局可用)
     */
    function buildCategoryTreeHTML(items) {
        let html = '<ul class="category-tree">';
        items.forEach(item => {
            html += `
                <li class="tree-item" data-id="${item.id}">
                    <div class="item-content">
                        <i class="fas fa-folder"></i>
                        <span class="item-name">${item.name}</span>
                        <div class="item-actions">
                            <button class="action-btn-sm" data-action="add" title="添加子类别"><i class="fas fa-plus"></i></button>
                            <button class="action-btn-sm" data-action="rename" title="重命名"><i class="fas fa-pen"></i></button>
                            <button class="action-btn-sm" data-action="move" title="移动"><i class="fas fa-arrows-alt"></i></button>
                            <button class="action-btn-sm" data-action="delete" title="删除"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
            `;
            if (item.children && item.children.length > 0) {
                html += buildCategoryTreeHTML(item.children);
            }
            html += '</li>';
        });
        html += '</ul>';
        return html;
    }
    
    /**
     * 渲染函数：根据笔记数组构建笔记列表的HTML
     */
    function buildNotesListHTML(notes) {
        if (!notes || notes.length === 0) {
            return '<p class="placeholder-text">这个分类下还没有笔记。</p>';
        }
        
        const extractText = (html) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            return tempDiv.textContent || tempDiv.innerText || "";
        };

        return notes.map(note => {
            const firstBlockContent = note.blocks.length > 0 ? note.blocks[0].content : '';
            const excerpt = extractText(firstBlockContent).substring(0, 100);

            return `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="note-item-header">
                        <h3>${note.title || '无标题笔记'}</h3>
                        <div class="note-item-actions">
                            <button class="action-btn-sm" data-note-action="delete" title="删除笔记"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="note-excerpt">${excerpt || '没有内容摘要...'}</p>
                    <span class="note-date">${note.creationDate}</span>
                </div>
            `;
        }).join('');
    }

    // 2. 然后再使用这些函数来初始化全局变量
    let categories = loadCategories();

    // ==================== 页面加载与路由逻辑 ====================

    /**
     * 动态加载页面的核心函数
     */
    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            appContainer.innerHTML = await response.text();
        } catch (error) {
            console.error('Failed to load page: ', error);
            appContainer.innerHTML = `<p style="color: red; text-align: center;">页面加载失败！</p>`;
        }
    }

    // ==================== 各页面初始化函数 ====================

    /**
     * "创建/编辑笔记"页面的初始化函数 (V2.1 - 修正版)
     */
    function initializeEditor() {
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
        Split(['#editor-panel', '#preview-panel'], { sizes: [55, 45], minSize: 350, gutterSize: 8, cursor: 'col-resize' });
        
        const mainQuill = new Quill('#editor-container', { 
            modules: { toolbar: [['bold', 'italic', 'underline'],['blockquote'],[{ 'header': 1 }, { 'header': 2 }], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] }, 
            placeholder: '在这里插入内容...', 
            theme: 'snow' 
        });

        // --- 4. 状态变量初始化 ---
        let noteBlocks = []
        let selectedDate = null;
        let selectedCategoryId = null;
        let selectedReviewModeId = null;

        // ★★★ 核心修正：将数据回填逻辑放在所有变量定义之后 ★★★ 
        if (isEditMode) { 
            const allNotes = JSON.parse(localStorage.getItem(APP_NOTES_STORAGE_KEY)) || []; 
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
                titleInput.value = noteToEdit.title; 
                dateDisplay.textContent = `创建日期: ${selectedDate}`; 
                
                const category = findCategoryById(selectedCategoryId); 
                if(category) { 
                    categoryTagContainer.innerHTML = `<span>${category.name}</span><button class="tag-close-btn" title="清除选择">&times;</button>`; 
                    archiveBtn.classList.add('selected'); 
                } 

                if (selectedReviewModeId) { 
                    const mode = findReviewModeById(selectedReviewModeId); 
                    if(mode) { 
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
                    dateDisplay.textContent = `创建日期: ${dateStr}`;
                    selectedDate = dateStr;
                }
            });
        }

        renderBlocks(); // 初次渲染笔记块

        // --- 6. 内部函数定义 ---
        const reviewModes = [
            { id: 'ebbinghaus_default', name: '艾宾浩斯 (默认)', intervals: [1, 2, 4, 7, 15, 30], isSystem: true },
            { id: 'custom_weekly', name: '每周回顾', intervals: [7, 14, 21, 28], isSystem: false }
        ];

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
        
        // renderBlocks, findCategoryById, findReviewModeById 在全局已有，这里不再重复定义

        // --- 7. 事件监听绑定 ---
        
        function renderBlocks() {
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

        function findCategoryById(id, items = categories) {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children && item.children.length > 0) {
                    const found = findCategoryById(id, item.children);
                    if (found) return found;
                }
            }
            return null;
        }

        function findReviewModeById(id) {
            return reviewModes.find(mode => mode.id === id) || null;
        }

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
                    const category = findCategoryById(selectedCategoryId); 
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
                        document.getElementById('manage-review-modes-link').addEventListener('click', (e) => { e.preventDefault(); Swal.fire('功能待开发', '管理自定义复习模式的功能将在后续版本中提供。', 'info'); }); 
                    }, 
                    preConfirm: () => { 
                        const selectedEl = document.querySelector('#review-mode-list-container .review-mode-item.selected'); 
                        if (!selectedEl) { Swal.showValidationMessage('请选择一个复习模式'); return null; } 
                        return selectedEl.dataset.id; 
                    } 
                }); 

                if (modeId) { 
                    selectedReviewModeId = modeId; 
                    const mode = findReviewModeById(selectedReviewModeId); 
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

        if (saveNoteBtn) { 
            saveNoteBtn.addEventListener('click', () => { 
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
                    const mode = findReviewModeById(selectedReviewModeId); 
                    if (mode && mode.intervals.length > 0) { 
                        const addDaysAndFormat = (d, days) => { const date = new Date(d); date.setDate(date.getDate() + days); return date.toISOString().split('T')[0]; }; 
                        finalNoteObject.review = { modeId: selectedReviewModeId, currentIntervalIndex: 0, nextReviewDate: addDaysAndFormat(selectedDate, mode.intervals[0]), lastReviewDate: null }; 
                    } 
                } 
                
                let allNotes = JSON.parse(localStorage.getItem(APP_NOTES_STORAGE_KEY)) || []; 
                
                // 核心：区分 新增 和 更新 逻辑 
                if (isEditMode) { 
                    // 更新模式：找到并替换数组中的旧笔记 
                    const noteIndex = allNotes.findIndex(note => note.id === editingNoteId); 
                    if (noteIndex !== -1) { 
                        allNotes[noteIndex] = finalNoteObject; 
                    } else { 
                        // 如果因为某些异常找不到，则追加，防止数据丢失 
                        allNotes.push(finalNoteObject); 
                    } 
                } else { 
                    // 创建模式：直接推入新笔记 
                    allNotes.push(finalNoteObject); 
                } 
                
                localStorage.setItem(APP_NOTES_STORAGE_KEY, JSON.stringify(allNotes)); 
                
                Swal.fire({ icon: 'success', title: isEditMode ? '笔记已更新！' : '笔记已存储！', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 }); 
                
                // 保存后，跳转回"所有笔记"页面，以便看到更新 
                allNotesBtn.click(); 
            }); 
        }
    }

    

    /**
     * "所有笔记"页面的初始化函数
     */
    function initializeAllNotesView() {
        // 1. 初始化三栏式布局
        Split(['#category-panel', '#notes-list-panel', '#note-preview-panel'], { sizes: [20, 30, 50], minSize: [200, 300, 400], gutterSize: 8, cursor: 'col-resize' });

        // 2. 获取所有需要的DOM元素
        const categoryPanel = document.getElementById('category-panel');
        const notesListPanel = document.getElementById('notes-list-panel');
        const notePreviewPanel = document.getElementById('note-preview-panel');
        const categoryPanelContent = categoryPanel.querySelector('.panel-content');
        const notesListPanelContent = notesListPanel.querySelector('.panel-content');
        const previewHeader = notePreviewPanel.querySelector('.panel-header h2');
        const previewContent = notePreviewPanel.querySelector('.panel-content');
        const addCategoryBtn = document.getElementById('add-category-btn');
        const editNoteBtn = document.getElementById('edit-note-btn'); // 新增获取编辑按钮
        const searchInput = document.getElementById('note-search-input'); // 新增：获取搜索框

        // --- 状态变量 ---
        let currentlySelectedNoteId = null; // 新增：用于跟踪当前预览的笔记ID
        let currentFilteredNotes = []; // 新增：用于存储当前分类下的笔记

        // 3. 渲染分类树
        const renderCategoryTree = () => {
            if (categoryPanelContent) {
                categoryPanelContent.innerHTML = categories.length > 0 ? buildCategoryTreeHTML(categories) : '<p class="placeholder-text">暂无分类。</p>';
            }
        };
        renderCategoryTree();

        // 4. 加载所有笔记
        const allNotes = JSON.parse(localStorage.getItem(APP_NOTES_STORAGE_KEY)) || [];

        // 5. 分类相关的事件监听
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', async () => {
                const { value: categoryName } = await Swal.fire({
                    title: '输入新的类别名称', input: 'text', inputPlaceholder: '例如：生活感悟',
                    showCancelButton: true, confirmButtonText: '创建', cancelButtonText: '取消',
                    inputValidator: (v) => !v || !v.trim() ? '类别名称不能为空！' : null
                });
                if (categoryName) {
                    categories.push({ id: Date.now(), name: categoryName.trim(), children: [] });
                    saveCategories();
                    renderCategoryTree();
                    Swal.fire({ icon: 'success', title: '创建成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                }
            });
        }

        categoryPanel.addEventListener('click', async function(event) {
            const actionButton = event.target.closest('.action-btn-sm');
            const targetItem = event.target.closest('.tree-item');

            if (!targetItem) return; // 如果点击的区域不在任何一个tree-item内，则忽略

            // --- Case 1: 点击的是操作按钮 (新增子类、重命名、删除等) ---
            if (actionButton) {
                event.stopPropagation(); // 阻止事件冒泡，防止触发下面的"选择分类"逻辑
                const categoryId = parseInt(targetItem.dataset.id);
                const action = actionButton.dataset.action;

                if (action === 'add') {
                    handleCreateSubCategory(categoryId, categoryPanelContent);
                } else if (action === 'rename') {
                    handleRenameCategory(categoryId, categoryPanelContent);
                } else if (action === 'delete') {
                    handleDeleteCategory(categoryId, categoryPanelContent, allNotes);
                } else {
                    alert(`功能 "${action}" 待开发`);
                }
                return; // 处理完动作后，结束函数
            }

            // --- Case 2: 点击的是分类项本身 (用于选择和筛选) ---
            categoryPanel.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));
            targetItem.classList.add('selected');
            
            const categoryId = parseInt(targetItem.dataset.id);
            // ★ 核心改动：筛选结果存入状态变量
            currentFilteredNotes = allNotes.filter(note => note.categoryId === categoryId);
            notesListPanelContent.innerHTML = buildNotesListHTML(currentFilteredNotes);
            searchInput.value = ''; // 切换分类时清空搜索框
        });

        // 6. 笔记列表的事件监听 (升级版)
        notesListPanel.addEventListener('click', async function(event) {
            const actionButton = event.target.closest('[data-note-action]');
            const targetItem = event.target.closest('.note-item');

            if (!targetItem) return;

            // --- Case 1: 点击的是操作按钮 ---
            if (actionButton) {
                event.stopPropagation();
                const noteId = parseInt(targetItem.dataset.noteId);
                const action = actionButton.dataset.noteAction;

                if (action === 'delete') {
                    // 1. 安全确认
                    const { isConfirmed } = await Swal.fire({
                        title: '确定要删除这篇笔记吗？',
                        text: "此操作将无法撤销！",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        confirmButtonText: '是的，删除！',
                        cancelButtonText: '取消'
                    });

                    if (isConfirmed) {
                        // 2. 数据操作
                        const noteIndex = allNotes.findIndex(note => note.id === noteId);
                        if (noteIndex > -1) {
                            allNotes.splice(noteIndex, 1);
                            localStorage.setItem(APP_NOTES_STORAGE_KEY, JSON.stringify(allNotes));
                        }
                        
                        // 3. UI刷新
                        // 从当前显示的列表中也移除
                        const noteIndexInFiltered = currentFilteredNotes.findIndex(note => note.id === noteId);
                        if(noteIndexInFiltered > -1) {
                            currentFilteredNotes.splice(noteIndexInFiltered, 1);
                        }
                        notesListPanelContent.innerHTML = buildNotesListHTML(currentFilteredNotes);

                        // 清空第三栏预览
                        previewHeader.textContent = '笔记预览';
                        previewContent.innerHTML = '<p class="placeholder-text">请选择一篇笔记进行预览。</p>';
                        currentlySelectedNoteId = null;

                        Swal.fire('已删除', '笔记已被成功删除。', 'success');
                    }
                }
                return;
            }

            // --- Case 2: 点击的是笔记项本身 (预览逻辑) ---
            notesListPanel.querySelectorAll('.note-item').forEach(item => item.classList.remove('selected'));
            targetItem.classList.add('selected');
            const noteId = parseInt(targetItem.dataset.noteId);
            const selectedNote = allNotes.find(note => note.id === noteId);
            if (selectedNote) {
                currentlySelectedNoteId = selectedNote.id;
                previewHeader.textContent = selectedNote.title || '无标题笔记';
                previewContent.innerHTML = selectedNote.blocks.map(block => block.content).join('');
            } else {
                currentlySelectedNoteId = null;
                previewHeader.textContent = '笔记预览';
                previewContent.innerHTML = '<p class="placeholder-text">无法加载该笔记内容。</p>';
            }
        });
        
        // ★★★ 7. 新增：为编辑按钮添加事件监听 ★★★
        if (editNoteBtn) {
            editNoteBtn.addEventListener('click', () => {
                if (currentlySelectedNoteId) {
                    // 将要编辑的笔记ID存入sessionStorage
                    sessionStorage.setItem('noteToEditId', currentlySelectedNoteId);
                    
                    // 跳转到编辑器页面
                    createNoteBtn.click(); // 模拟点击"创建新笔记"按钮来触发路由
                } else {
                    Swal.fire('请先选择一篇笔记', '您需要先在中间的列表里点击一篇笔记，才能进行编辑。', 'info');
                }
            });
        }

        // ★★★ 8. 新增：为搜索框添加实时输入事件监听 ★★★
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase().trim();
                
                // 如果搜索词为空，则显示当前分类下的所有笔记
                if (!searchTerm) {
                    notesListPanelContent.innerHTML = buildNotesListHTML(currentFilteredNotes);
                    return;
                }

                // 从当前已筛选的笔记中进行二次筛选
                const searchedNotes = currentFilteredNotes.filter(note => {
                    const titleMatch = note.title && note.title.toLowerCase().includes(searchTerm);
                    
                    // 将所有block的内容转为纯文本再搜索
                    const contentMatch = note.blocks.some(block => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = block.content;
                        const blockText = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();
                        return blockText.includes(searchTerm);
                    });

                    return titleMatch || contentMatch;
                });

                // 渲染搜索结果
                notesListPanelContent.innerHTML = buildNotesListHTML(searchedNotes);
            });
        }
    }

    // ==================== 新增代码 开始 ====================
    /**
     * 辅助函数：在分类树中递归查找分类
     * @param {number} categoryId - 目标分类ID
     * @param {Array} items - 当前要搜索的分类数组
     * @returns {Object|null} - 找到的分类对象或null
     */
    function findCategoryById(categoryId, items = categories) {
        for (const item of items) {
            if (item.id === categoryId) return item;
            if (item.children && item.children.length > 0) {
                const found = findCategoryById(categoryId, item.children);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * 辅助函数：在分类树中递归查找并执行操作
     * @param {number} categoryId - 目标分类ID
     * @param {Array} items - 当前要搜索的分类数组
     * @param {Function} callback - 找到后要执行的回调函数
     * @returns {boolean} - 是否找到了并成功执行了操作
     */
    function findAndOperateInCategoryTree(categoryId, items, callback) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === categoryId) {
                callback(items, i); // 将父数组和当前索引传递给回调
                return true;
            }
            if (items[i].children && items[i].children.length > 0) {
                if (findAndOperateInCategoryTree(categoryId, items[i].children, callback)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 处理函数：重命名分类
     */
    async function handleRenameCategory(categoryId, uiContainer) {
        const categoryToRename = findCategoryById(categoryId, categories);
        if (!categoryToRename) return;

        const { value: newName } = await Swal.fire({
            title: '重命名分类',
            input: 'text',
            inputValue: categoryToRename.name,
            showCancelButton: true,
            confirmButtonText: '更新',
            cancelButtonText: '取消',
            inputValidator: (value) => {
                if (!value || value.trim().length === 0) {
                    return '类别名称不能为空！'
                }
            }
        });

        if (newName && newName.trim() !== categoryToRename.name) {
            categoryToRename.name = newName.trim();
            saveCategories();
            uiContainer.innerHTML = buildCategoryTreeHTML(categories);
            Swal.fire({ icon: 'success', title: '重命名成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    }

    /**
     * 处理函数：删除分类
     */
    async function handleDeleteCategory(categoryId, uiContainer, allNotes) {
        // 安全检查：检查该分类下是否有笔记
        const notesInCategory = allNotes.filter(note => note.categoryId === categoryId);
        if (notesInCategory.length > 0) {
            Swal.fire('无法删除', `此分类下包含 ${notesInCategory.length} 篇笔记，请先移动或删除这些笔记。`, 'error');
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: '确定要删除这个分类吗？',
            text: "此操作将无法撤销！",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '是的，删除它！',
            cancelButtonText: '取消'
        });

        if (isConfirmed) {
            findAndOperateInCategoryTree(categoryId, categories, (items, index) => {
                items.splice(index, 1); // 从数组中删除
            });
            saveCategories();
            uiContainer.innerHTML = buildCategoryTreeHTML(categories);
            Swal.fire({ icon: 'success', title: '删除成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    }

    /**
     * 处理函数：创建子分类
     */
    async function handleCreateSubCategory(parentId, uiContainer) {
        const { value: categoryName } = await Swal.fire({
            title: '输入子分类名称',
            input: 'text',
            inputPlaceholder: '例如：第一章 函数与极限',
            showCancelButton: true,
            confirmButtonText: '创建',
            cancelButtonText: '取消',
            inputValidator: (value) => {
                if (!value || value.trim().length === 0) {
                    return '子分类名称不能为空！'
                }
            }
        });

        if (categoryName) {
            // 1. 查找父级分类对象
            const parentCategory = findCategoryById(parentId, categories);
            if (parentCategory) {
                // 2. 创建新的子分类对象
                const newSubCategory = {
                    id: Date.now(),
                    name: categoryName.trim(),
                    children: []
                };

                // 3. 添加到父级的children数组中
                parentCategory.children.push(newSubCategory);

                // 4. 持久化并刷新UI
                saveCategories();
                uiContainer.innerHTML = buildCategoryTreeHTML(categories);
                
                Swal.fire({ icon: 'success', title: '子分类创建成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } else {
                Swal.fire('错误', '找不到父级分类，无法创建子分类。', 'error');
            }
        }
    }
    // ==================== 新增代码 结束 ====================

    // --- 路由事件绑定 ---
    homeBtn.addEventListener('click', (e) => { e.preventDefault(); loadPage('partials/welcome.html'); });
    createNoteBtn.addEventListener('click', async (e) => { e.preventDefault(); await loadPage('partials/editor.html'); initializeEditor(); });
    if(allNotesBtn) {
        allNotesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await loadPage('partials/all-notes.html');
            initializeAllNotesView();
        });
    }
    
    // --- 默认加载 ---
    loadPage('partials/welcome.html');
});