import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/modal.css';
import './styles/views/welcome.css';
import './styles/views/editor.css';
import './styles/views/todo.css';
import './styles/views/all-notes.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { loadPage } from './router.js';

document.addEventListener('DOMContentLoaded', function () {
    const homeBtn = document.getElementById('home-btn');
    const createNoteBtn = document.getElementById('create-note-btn');
    const todoBtn = document.getElementById('todo-btn');
    const allNotesBtn = document.getElementById('all-notes-btn');
    const settingsBtn = document.getElementById('settings-btn');

    // Event listeners
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => { e.preventDefault(); loadPage('/partials/welcome.html'); });
    }
    
    if (createNoteBtn) {
        createNoteBtn.addEventListener('click', async (e) => { 
            e.preventDefault(); 
            await loadPage('/partials/editor.html'); 
            // initializeEditor is called inside loadPage based on URL
        }); 
    }

    if (todoBtn) {
        todoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            loadPage('/partials/todo.html'); 
        });
    }
    
    if(allNotesBtn) {
        allNotesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            loadPage('/partials/all-notes.html');
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            loadPage('/partials/settings.html');
        });
    }

    // Initial load
    loadPage('/partials/welcome.html');
});
