import { initializeEditor } from './views/editor.js';
import { initializeAllNotesView } from './views/allNotes.js';

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
        }
    } catch (error) {
        console.error('Failed to load page: ', error);
        appContainer.innerHTML = `<p style="color: red; text-align: center;">页面加载失败！</p>`;
    }
}
