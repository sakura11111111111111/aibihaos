import API_BASE_URL from './config.js';

export async function getAllNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
    return [];
}

export async function saveNote(note) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        
        return response.ok;
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
        
        return response.ok;
    } catch (error) {
        console.error('Failed to delete note:', error);
    }
    return false;
}
