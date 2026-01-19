import * as reviewModeApi from './api/reviewModes.js';
import * as categoryApi from './api/categories.js';
import * as noteApi from './api/notes.js';

export let categories = [];
export let allNotes = [];
export let reviewModes = [];

// Helper to rebuild tree from flat list (if needed)
function buildCategoryTree(flatCategories) {
    const map = {};
    const tree = [];
    
    // First pass: create nodes
    flatCategories.forEach(cat => {
        map[cat.id] = { ...cat, children: [] };
    });
    
    // Second pass: link children to parents
    flatCategories.forEach(cat => {
        if (cat.parent_id && map[cat.parent_id]) {
            map[cat.parent_id].children.push(map[cat.id]);
        } else {
            tree.push(map[cat.id]);
        }
    });
    
    return tree;
}

export async function loadReviewModes() {
    reviewModes = await reviewModeApi.getAllReviewModes();
    return reviewModes;
}

export async function saveReviewModes() {
    console.warn('saveReviewModes is deprecated. Use add/deleteReviewMode instead.');
}

export async function addReviewMode(name, intervals) {
    const newMode = {
        id: 'custom_' + Date.now(),
        name: name,
        description: `自定义模式 (${intervals.length} 阶段)`,
        intervals: intervals,
        isSystem: false
    };
    
    const success = await reviewModeApi.createReviewMode(newMode);
    
    if (success) {
        reviewModes.push(newMode);
        return newMode;
    }
    return null;
}

export async function deleteReviewMode(id) {
    const success = await reviewModeApi.deleteReviewMode(id);
    
    if (success) {
        const index = reviewModes.findIndex(m => m.id === id);
        if (index !== -1) {
            reviewModes.splice(index, 1);
            return true;
        }
    }
    return false;
}

export function getReviewModeById(id) {
    return reviewModes.find(m => m.id === id);
}

export async function loadCategories() {
    const flatCats = await categoryApi.getAllCategories();
    categories = buildCategoryTree(flatCats);
    return categories;
}

export async function saveCategories() {
    console.warn('saveCategories is deprecated. Use API directly.');
}

// Helper to be called by frontend when adding category
export async function createCategory(name, parentId = null) {
    const id = Date.now(); 
    const success = await categoryApi.createCategory(id, name, parentId);
    
    if (success) {
        // Reload to get fresh tree
        await loadCategories();
        return true;
    }
    return false;
}

export async function loadNotes() {
    allNotes = await noteApi.getAllNotes();
    return allNotes;
}

export async function saveNotes() {
    console.warn('saveNotes is deprecated. Use API directly.');
}

// New helper for saving a single note
export async function saveSingleNote(note) {
    const success = await noteApi.saveNote(note);
    
    if (success) {
        // Update local cache
        const index = allNotes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            allNotes[index] = note;
        } else {
            allNotes.push(note);
        }
        return true;
    }
    return false;
}

export async function deleteNote(id) {
    const success = await noteApi.deleteNote(id);
    
    if (success) {
        const index = allNotes.findIndex(n => n.id === id);
        if (index !== -1) {
            allNotes.splice(index, 1);
        }
        return true;
    }
    return false;
}

// Initialize (Async now)
(async () => {
    await loadReviewModes();
    await loadCategories();
    await loadNotes();
})();

