document.addEventListener('DOMContentLoaded', () => {
    const bookmarkList = document.getElementById('bookmarkList');
    const selectAllBtn = document.getElementById('selectAll');
    const deselectAllBtn = document.getElementById('deselectAll');
    const deleteSelectedBtn = document.getElementById('deleteSelected');
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
  
    let lastChecked = null; // Keep track of last checked checkbox
  
    // Create folder element
    function createFolderElement(bookmark) {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder';
      
      const headerDiv = document.createElement('div');
      headerDiv.className = 'folder-header';
      headerDiv.innerHTML = `
        <span class="toggle-icon">▶</span>
        <input type="checkbox" class="selectable" data-folder-id="${bookmark.id}">
        <span class="bookmark-title">${bookmark.title}</span>
      `;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'folder-content';
      
      folderDiv.appendChild(headerDiv);
      folderDiv.appendChild(contentDiv);
      
      // Toggle expansion on click
      headerDiv.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          contentDiv.classList.toggle('expanded');
          const icon = headerDiv.querySelector('.toggle-icon');
          icon.textContent = contentDiv.classList.contains('expanded') ? '▼' : '▶';
        }
      });
      
      return { folderDiv, contentDiv };
    }
  
    // Handle shift-click selection
    function handleShiftClick(checkboxes, currentCheckbox, lastChecked) {
      if (!lastChecked) return;
  
      const start = Array.from(checkboxes).indexOf(lastChecked);
      const end = Array.from(checkboxes).indexOf(currentCheckbox);
      
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      
      checkboxes.forEach((checkbox, i) => {
        if (i >= min && i <= max) {
          checkbox.checked = currentCheckbox.checked;
        }
      });
    }
  
    // Display bookmarks recursively
    function displayBookmarks(bookmarkItems, container) {
      bookmarkItems.forEach(bookmark => {
        if (bookmark.children) {
          const { folderDiv, contentDiv } = createFolderElement(bookmark);
          container.appendChild(folderDiv);
          displayBookmarks(bookmark.children, contentDiv);
        } else if (bookmark.url) {
          const bookmarkDiv = document.createElement('div');
          bookmarkDiv.className = 'bookmark-item';
          bookmarkDiv.innerHTML = `
            <input type="checkbox" class="selectable" data-id="${bookmark.id}">
            <span class="bookmark-title">${bookmark.title}</span>
          `;
          container.appendChild(bookmarkDiv);
        }
      });
    }
  
    // Handle checkbox clicks with shift functionality
    document.addEventListener('click', (e) => {
      if (e.target.matches('.selectable')) {
        const checkboxes = document.querySelectorAll('.selectable');
        
        if (e.shiftKey && lastChecked) {
          handleShiftClick(checkboxes, e.target, lastChecked);
        }
        
        lastChecked = e.target;
      }
    });
  
    // Load all bookmarks
    function loadBookmarks() {
      browser.bookmarks.getTree().then((bookmarkItems) => {
        bookmarkList.innerHTML = '';
        displayBookmarks(bookmarkItems, bookmarkList);
        lastChecked = null; // Reset last checked when reloading
      });
    }
  
    selectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.selectable').forEach(checkbox => {
        checkbox.checked = true;
      });
    });
  
    deselectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.selectable').forEach(checkbox => {
        checkbox.checked = false;
      });
      lastChecked = null; // Reset last checked when deselecting all
    });
  
    expandAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.folder-content').forEach(content => {
        content.classList.add('expanded');
      });
      document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
      });
    });
  
    collapseAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.folder-content').forEach(content => {
        content.classList.remove('expanded');
      });
      document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▶';
      });
    });
  
    deleteSelectedBtn.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.selectable:checked');
      if (selectedBoxes.length === 0) {
        alert('Please select bookmarks to delete');
        return;
      }
  
      if (confirm(`Delete ${selectedBoxes.length} selected items?`)) {
        const deletePromises = Array.from(selectedBoxes).map(checkbox => {
          const id = checkbox.dataset.id || checkbox.dataset.folderId;
          return browser.bookmarks.removeTree(id);
        });
  
        Promise.all(deletePromises).then(() => {
          loadBookmarks();
        }).catch(error => {
          console.error('Error deleting bookmarks:', error);
          alert('Error deleting bookmarks');
        });
      }
    });
  
    // Initial load
    loadBookmarks();
  });