import './style.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { loadPage } from './router.js';

document.addEventListener('DOMContentLoaded', function () {
    const homeBtn = document.getElementById('home-btn');
    const createNoteBtn = document.getElementById('create-note-btn');
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
