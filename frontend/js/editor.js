// frontend/js/editor.js
class SQLEditor {
  constructor() {
    this.editorInstance = null;
    this.currentDatabase = null;
    this.resultsContainer = document.getElementById('query-results');
    this.historyList = [];
    this.currentHistoryIndex = -1;
    this.resizeHandle = null;
    this.editorContainer = null;
    this.isResizing = false;

    this.init();
  }

  init() {
    this.setupEditor();
    this.setupResizable();
    this.setupEventListeners();
    this.loadHistory();
  }

  setupEditor() {
    const editorElement = document.getElementById('sql-editor');
    if (!editorElement) return;

    this.editorContainer = document.querySelector('.sql-editor-container');

    // Initialize CodeMirror with SQL mode
    this.editorInstance = CodeMirror(editorElement, {
      mode: 'text/x-mysql',
      theme: 'lyra',
      lineNumbers: true,
      indentWithTabs: false,
      indentUnit: 4,
      smartIndent: true,
      lineWrapping: true,
      matchBrackets: true,
      autofocus: true,
      extraKeys: {
        'Ctrl-Enter': () => this.executeQuery(),
        'Cmd-Enter': () => this.executeQuery(), // macOS support
        'Ctrl-Up': () => this.navigateHistory(-1),
        'Ctrl-Down': () => this.navigateHistory(1),
        'Tab': cm => {
          if (cm.somethingSelected()) {
            cm.indentSelection('add');
          } else {
            cm.replaceSelection('    '); // Insert 4 spaces
          }
        }
      },
      placeholder: 'Enter SQL query here...'
    });

    // Create run button in editor
    this.createRunButton();
  }

  createRunButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'editor-toolbar';

    const runButton = document.createElement('button');
    runButton.className = 'btn btn-primary btn-sm';
    runButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      Run Query
    `;
    runButton.addEventListener('click', () => this.executeQuery());

    buttonContainer.appendChild(runButton);
    this.editorContainer.appendChild(buttonContainer);
  }

  setupResizable() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'resize-handle editor-resize-handle';
    this.editorContainer.appendChild(this.resizeHandle);

    let startY, startHeight;

    this.resizeHandle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      startY = e.clientY;
      startHeight = this.editorContainer.offsetHeight;

      document.body.classList.add('resize-active');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isResizing) return;

      const newHeight = startHeight + (e.clientY - startY);
      if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
        this.editorContainer.style.height = `${newHeight}px`;
        this.editorInstance.refresh();
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isResizing) {
        this.isResizing = false;
        document.body.classList.remove('resize-active');

        // Save editor height preference
        const height = this.editorContainer.offsetHeight;
        localStorage.setItem('lyradb_editor_height', height.toString());
      }
    });

    // Restore saved height
    const savedHeight = localStorage.getItem('lyradb_editor_height');
    if (savedHeight) {
      this.editorContainer.style.height = `${savedHeight}px`;
      // Let the editor adjust to its container
      setTimeout(() => this.editorInstance.refresh(), 0);
    }
  }

  setupEventListeners() {
    // Listen for database changes
    document.addEventListener('lyradb:database-changed', (event) => {
      this.currentDatabase = event.detail.database;
      // Clear previous results when database changes
      if (this.resultsContainer) {
        this.resultsContainer.innerHTML = '<div class="placeholder">Execute a query to see results</div>';
      }
    });

    // Listen for theme changes
    document.addEventListener('lyradb:theme-changed', () => {
      // Allow CodeMirror to adjust to the new theme
      setTimeout(() => this.editorInstance.refresh(), 0);
    });
  }

  loadHistory() {
    const savedHistory = localStorage.getItem('lyradb_query_history');
    if (savedHistory) {
      try {
        this.historyList = JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to parse query history:', e);
        this.historyList = [];
      }
    }
  }

  saveHistory() {
    // Keep only the last 100 queries
    const historyToSave = this.historyList.slice(-100);
    localStorage.setItem('lyradb_query_history', JSON.stringify(historyToSave));
  }

  addToHistory(query) {
    // Don't add duplicates consecutively
    if (this.historyList.length > 0 && this.historyList[this.historyList.length - 1] === query) {
      return;
    }

    this.historyList.push(query);
    this.currentHistoryIndex = this.historyList.length;
    this.saveHistory();
  }

  navigateHistory(direction) {
    if (!this.historyList.length) return;

    this.currentHistoryIndex += direction;

    // Boundary checks
    if (this.currentHistoryIndex < 0) {
      this.currentHistoryIndex = 0;
    } else if (this.currentHistoryIndex >= this.historyList.length) {
      this.currentHistoryIndex = this.historyList.length;
      // Clear editor when going beyond newest item
      this.editorInstance.setValue('');
      return;
    }

    const historyItem = this.historyList[this.currentHistoryIndex];
    this.editorInstance.setValue(historyItem);
    // Move cursor to end
    const lastLine = this.editorInstance.lineCount() - 1;
    const lastCh = this.editorInstance.getLine(lastLine).length;
    this.editorInstance.setCursor(lastLine, lastCh);
  }

  async executeQuery() {
    if (!this.currentDatabase) {
      this.showError('Please select a database first');
      return;
    }

    const query = this.editorInstance.getValue().trim();
    if (!query) {
      this.showError('Query cannot be empty');
      return;
    }

    this.addToHistory(query);
    this.showLoading();

    try {
      const response = await fetch('backend/api/query.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: this.currentDatabase,
          query: query
        })
      });

      const data = await response.json();

      if (data.error) {
        this.showError(data.error);
        return;
      }

      this.renderResults(data);
    } catch (error) {
      this.showError(`Failed to execute query: ${error.message}`);
    }
  }

  showLoading() {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p class="mt-2">Executing query...</p>
      </div>
    `;
  }

  showError(message) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div class="p-4 text-red-500 dark:text-red-400">
        <div class="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span class="font-medium">Error</span>
        </div>
        <p class="ml-7">${LyraUtils.escapeHtml(message)}</p>
      </div>
    `;
  }

  renderResults(data) {
    if (!this.resultsContainer) return;

    if (data.rows && data.rows.length > 0) {
      // Display results as a table
      const headers = Object.keys(data.rows[0]);

      let tableHtml = `
        <div class="overflow-x-auto">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            ${data.rows.length} row${data.rows.length === 1 ? '' : 's'} returned
            in ${data.executionTime} ms
            <button id="export-csv" class="text-blue-500 hover:underline cursor-pointer float-right">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                stroke-linejoin="round" class="inline-block mr-1 align-text-bottom">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </button>
          </div>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                ${headers.map(h => `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">${LyraUtils.escapeHtml(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
      `;

      data.rows.forEach((row, i) => {
        tableHtml += `<tr class="${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}">`;
        headers.forEach(header => {
          const value = row[header];
          const displayValue = value === null ?
              '<span class="text-gray-400 dark:text-gray-500 italic">NULL</span>' :
              LyraUtils.escapeHtml(String(value));

          tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm">${displayValue}</td>`;
        });
        tableHtml += '</tr>';
      });

      tableHtml += `
            </tbody>
          </table>
        </div>
      `;

      this.resultsContainer.innerHTML = tableHtml;

      // Add event listener to the export button
      document.getElementById('export-csv')?.addEventListener('click', () => this.exportResults(data.rows, headers));

    } else if (data.affectedRows !== undefined) {
      // Display success message for non-SELECT queries
      this.resultsContainer.innerHTML = `
        <div class="p-4 text-green-600 dark:text-green-400">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="font-medium">Query executed successfully</span>
          </div>
          <div class="mt-2 ml-7">
            <p>${data.affectedRows} row(s) affected</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Execution time: ${data.executionTime} ms</p>
          </div>
        </div>
      `;
    } else {
      // Empty result
      this.resultsContainer.innerHTML = `
        <div class="p-4 text-gray-500 dark:text-gray-400">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span class="font-medium">No results returned</span>
          </div>
          <p class="mt-1 ml-7 text-sm">Query executed in ${data.executionTime} ms</p>
        </div>
      `;
    }
  }

  exportResults(rows, headers) {
    if (!rows || !headers) {
      this.showError('No data to export');
      return;
    }

    // Function to properly escape CSV values
    const escapeCSV = (value) => {
      if (value === null) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Generate CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Format the date for the filename
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');

    link.setAttribute('href', url);
    link.setAttribute('download', `${this.currentDatabase}_export_${dateStr}.csv`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getValue() {
    return this.editorInstance ? this.editorInstance.getValue() : '';
  }

  setValue(text) {
    if (this.editorInstance) {
      this.editorInstance.setValue(text);
    }
  }

  focus() {
    if (this.editorInstance) {
      this.editorInstance.focus();
    }
  }

  insertAtCursor(text) {
    if (this.editorInstance) {
      const cursor = this.editorInstance.getCursor();
      this.editorInstance.replaceRange(text, cursor);
    }
  }

  refreshEditor() {
    if (this.editorInstance) {
      this.editorInstance.refresh();
    }
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  window.lyraEditor = new SQLEditor();
});

// Export module for potential use with bundlers
export default SQLEditor;