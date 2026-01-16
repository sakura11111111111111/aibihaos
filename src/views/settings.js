import Swal from 'sweetalert2';
import { allNotes, categories, saveNotes, saveCategories, loadNotes, loadCategories } from '../store.js';

export function initializeSettings() {
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const fileInput = document.getElementById('import-file-input');

    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleImport);
    }
}

function handleExport() {
    try {
        const data = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            notes: allNotes,
            categories: categories
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: '导出成功',
            text: '您的数据备份文件已开始下载。',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Export failed:', error);
        Swal.fire('导出失败', '生成备份文件时出错，请稍后重试。', 'error');
    }
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Confirm before overwriting
    const { isConfirmed } = await Swal.fire({
        title: '警告：覆盖数据',
        text: "导入操作将完全清除并覆盖您当前的笔记和分类！建议先导出当前数据作为备份。",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: '取消',
        confirmButtonText: '是的，覆盖导入'
    });

    if (!isConfirmed) {
        event.target.value = ''; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Basic validation
            if (!data.notes || !data.categories) {
                throw new Error('Invalid backup file format');
            }

            // Update store logic would be better if store exported setters, 
            // but for now we manipulate localStorage and reload
            localStorage.setItem('my-notes-app-data', JSON.stringify(data.notes));
            localStorage.setItem('my-notes-app-categories', JSON.stringify(data.categories));
            
            // Force reload data in store (since we don't have reactive state management)
            loadNotes();
            loadCategories();

            Swal.fire({
                icon: 'success',
                title: '导入成功',
                text: `成功恢复了 ${data.notes.length} 篇笔记。`,
            }).then(() => {
                // Refresh page to ensure all UI components are updated
                window.location.reload();
            });

        } catch (error) {
            console.error('Import failed:', error);
            Swal.fire('导入失败', '文件格式不正确或已损坏。', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}
