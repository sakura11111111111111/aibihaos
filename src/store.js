import { APP_CATEGORIES_STORAGE_KEY, APP_NOTES_STORAGE_KEY } from './config.js';

export let categories = [];
export let allNotes = [];
export let reviewModes = [];

const APP_REVIEW_MODES_STORAGE_KEY = 'advanced-notes-review-modes';

export function loadReviewModes() {
    const storedModes = localStorage.getItem(APP_REVIEW_MODES_STORAGE_KEY);
    if (storedModes) {
        reviewModes = JSON.parse(storedModes);
    } else {
        // Default System Modes
        reviewModes = [
            { 
                id: 'ebbinghaus_default', 
                name: '艾宾浩斯 (系统推荐)', 
                description: '基于经典遗忘曲线，适合长期记忆',
                // Updated per user request: 1, 1, 2, 3, 5, 8, 15, 30, 60
                intervals: [1, 1, 2, 3, 5, 8, 15, 30, 60], 
                isSystem: true 
            },
            { 
                id: 'custom_weekly', 
                name: '每周回顾', 
                description: '每周一次，共复习4次',
                intervals: [7, 7, 7, 7], 
                isSystem: true 
            }
        ];
        saveReviewModes(); // Persist defaults
    }
    return reviewModes;
}

export function saveReviewModes() {
    localStorage.setItem(APP_REVIEW_MODES_STORAGE_KEY, JSON.stringify(reviewModes));
}

export function addReviewMode(name, intervals) {
    const newMode = {
        id: 'custom_' + Date.now(),
        name: name,
        description: `自定义模式 (${intervals.length} 阶段)`,
        intervals: intervals,
        isSystem: false
    };
    reviewModes.push(newMode);
    saveReviewModes();
    return newMode;
}

export function deleteReviewMode(id) {
    const index = reviewModes.findIndex(m => m.id === id);
    if (index !== -1 && !reviewModes[index].isSystem) {
        reviewModes.splice(index, 1);
        saveReviewModes();
        return true;
    }
    return false;
}

export function getReviewModeById(id) {
    return reviewModes.find(m => m.id === id);
}

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
loadReviewModes();
