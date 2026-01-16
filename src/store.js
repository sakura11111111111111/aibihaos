import { APP_CATEGORIES_STORAGE_KEY, APP_NOTES_STORAGE_KEY } from './config.js';

export let categories = [];
export let allNotes = [];

export function loadCategories() {
    const storedCategories = localStorage.getItem(APP_CATEGORIES_STORAGE_KEY);
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
    } else {
        categories = [
            { id: 1, name: '高数冲刺', children: [ { id: 11, name: '多元函数', children: [] } ] },
            { id: 2, name: '二重积分', children: [] },
            { id: 3, name: '大营销项目', children: [] }
        ];
    }
    return categories;
}

export function saveCategories() {
    localStorage.setItem(APP_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
}

export function loadNotes() {
    const storedNotes = localStorage.getItem(APP_NOTES_STORAGE_KEY);
    allNotes = storedNotes ? JSON.parse(storedNotes) : [];
    return allNotes;
}

export function saveNotes() {
    localStorage.setItem(APP_NOTES_STORAGE_KEY, JSON.stringify(allNotes));
}

// Initialize
loadCategories();
loadNotes();
