import API_BASE_URL from './config.js';

export async function getAllCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    return [];
}

export async function createCategory(id, name, parentId = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, parent_id: parentId })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Failed to create category:', error);
    }
    return false;
}
