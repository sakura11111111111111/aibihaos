export function findCategoryById(id, items) {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children && item.children.length > 0) {
            const found = findCategoryById(id, item.children);
            if (found) return found;
        }
    }
    return null;
}

export function findAndOperateInCategoryTree(categoryId, items, callback) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === categoryId) {
            callback(items, i);
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
