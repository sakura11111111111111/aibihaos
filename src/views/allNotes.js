import Split from 'split.js';
import Swal from 'sweetalert2';
import { categories, saveCategories, allNotes, saveNotes, loadNotes } from '../store.js';
import { buildCategoryTreeHTML, buildNotesListHTML } from '../components.js';
import { findCategoryById, findAndOperateInCategoryTree } from '../utils.js';

export function initializeAllNotesView() {
    // 1. 初始化三栏式布局
    if (document.querySelector('#category-panel')) {
        Split(['#category-panel', '#notes-list-panel', '#note-preview-panel'], { sizes: [20, 30, 50], minSize: [200, 300, 400], gutterSize: 8, cursor: 'col-resize' });
    }

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
    const createNoteBtn = document.getElementById('create-note-btn'); // Needed for edit jump

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
    loadNotes(); // Ensure we have latest notes

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
                        saveNotes();
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
                if(createNoteBtn) createNoteBtn.click(); // 模拟点击"创建新笔记"按钮来触发路由
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

    // --- Helpers for category operations ---
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
}
