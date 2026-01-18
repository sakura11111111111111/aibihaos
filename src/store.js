const API_BASE_URL = 'http://localhost:3000/api';

export let categories = [];
export let allNotes = [];
export let reviewModes = [];

// Helper to rebuild tree from flat list (if needed)
// Currently backend sends flat list for categories, but frontend expects tree for some views?
// Actually, backend sends flat list. We need to reconstruct tree here if frontend relies on 'children' property.
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
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes`);
        if (response.ok) {
            reviewModes = await response.json();
        } else {
            console.error('Failed to load review modes');
            // Fallback to defaults if backend fails?
            // reviewModes = [ ...defaults... ];
        }
    } catch (error) {
        console.error('Error loading review modes:', error);
    }
    return reviewModes;
}

export async function saveReviewModes() {
    // With backend, we usually save individual items. 
    // This function might be deprecated or used to sync bulk changes?
    // For now, let's keep it empty or log warning.
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
    
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMode)
        });
        
        if (response.ok) {
            reviewModes.push(newMode);
            return newMode;
        }
    } catch (error) {
        console.error('Failed to add review mode:', error);
    }
    return null;
}

export async function deleteReviewMode(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const index = reviewModes.findIndex(m => m.id === id);
            if (index !== -1) {
                reviewModes.splice(index, 1);
                return true;
            }
        }
    } catch (error) {
        console.error('Failed to delete review mode:', error);
    }
    return false;
}

export function getReviewModeById(id) {
    return reviewModes.find(m => m.id === id);
}

export async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            const flatCats = await response.json();
            categories = buildCategoryTree(flatCats);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    return categories;
}

export async function saveCategories() {
    // Deprecated for bulk save. Individual CRUD should be used.
    // For now, frontend code might still call this.
    // Ideally we should refactor frontend to call addCategory/deleteCategory API directly.
    // But to minimize changes, maybe we just don't do anything here and rely on specific actions?
    // Wait, the frontend code in allNotes.js modifies 'categories' array directly and calls saveCategories().
    // We need to intercept those changes.
    // This is tricky without changing frontend logic significantly.
    // Option: Implement a 'sync' function or update allNotes.js to call API.
    // Let's just log for now.
    console.warn('saveCategories is deprecated. Use API directly.');
}

// Helper to be called by frontend when adding category
export async function createCategory(name, parentId = null) {
    try {
        // Use a temp ID or let backend generate?
        // Let's generate a timestamp ID to match current frontend logic
        const id = Date.now(); 
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, parent_id: parentId })
        });
        
        if (response.ok) {
            // Reload to get fresh tree
            await loadCategories();
            return true;
        }
    } catch (error) {
        console.error('Failed to create category:', error);
    }
    return false;
}

export async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        if (response.ok) {
            allNotes = await response.json();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
    return allNotes;
}

export async function saveNotes() {
    // This is called by frontend after modifying 'allNotes' array (e.g. deleting).
    // Or when saving a specific note.
    // If it's a bulk save, we can't easily map to API.
    // BUT, editor.js calls saveNotes() after pushing to allNotes.
    // We should intercept the *specific* note save in editor.js.
    // For deletion (in allNotes.js), it splices array then calls saveNotes().
    // We need to change that logic to call API delete.
    console.warn('saveNotes is deprecated. Use API directly.');
}

// New helper for saving a single note
export async function saveSingleNote(note) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        
        if (response.ok) {
            // Update local cache
            const index = allNotes.findIndex(n => n.id === note.id);
            if (index !== -1) {
                allNotes[index] = note;
            } else {
                allNotes.push(note);
            }
            return true;
        }
    } catch (error) {
        console.error('Failed to save note:', error);
    }
    return false;
}

export async function deleteNote(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const index = allNotes.findIndex(n => n.id === id);
            if (index !== -1) {
                allNotes.splice(index, 1);
            }
            return true;
        }
    } catch (error) {
        console.error('Failed to delete note:', error);
    }
    return false;
}

// Initialize (Async now)
(async () => {
    await loadReviewModes();
    await loadCategories();
    await loadNotes();
    // Dispatch event to notify app that data is loaded?
    // Since main.js might render before data is ready.
    // Simple fix: reload page or use reactive UI.
    // For now, we rely on the fact that views call loadNotes() too.
})();
