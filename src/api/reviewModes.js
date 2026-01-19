import API_BASE_URL from './config.js';

export async function getAllReviewModes() {
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading review modes:', error);
    }
    return [];
}

export async function createReviewMode(mode) {
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mode)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Failed to add review mode:', error);
    }
    return false;
}

export async function deleteReviewMode(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/review-modes/${id}`, {
            method: 'DELETE'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Failed to delete review mode:', error);
    }
    return false;
}
