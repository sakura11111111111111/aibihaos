import { initializeEditor } from './views/editor.js';
import { initializeAllNotesView } from './views/allNotes.js';
import { initializeSettings } from './views/settings.js';
import { initializeTodoView } from './views/todo.js';

export async function loadPage(url) {
    const appContainer = document.getElementById('app-container');
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        appContainer.innerHTML = await response.text();
        
        // Simple router logic based on URL
        if (url.includes('editor')) {
            initializeEditor();
        } else if (url.includes('all-notes')) {
            initializeAllNotesView();
        } else if (url.includes('settings')) {
            initializeSettings();
        } else if (url.includes('todo')) {
            initializeTodoView();
        }
    } catch (error) {
        console.error('Failed to load page: ', error);
        appContainer.innerHTML = `<p style="color: red; text-align: center;">页面加载失败！</p>`;
    }
}
