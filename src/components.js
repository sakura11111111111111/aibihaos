export function buildCategoryTreeHTML(items) {
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

export function buildNotesListHTML(notes) {
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
