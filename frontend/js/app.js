// frontend/js/app.js - Main application logic for LyraDB

class LyraDB {
    constructor() {
        this.databases = [];
        this.currentDatabase = null;
        this.currentTable = null;
        this.resizing = false;

        this.init();
    }

    async init() {
        this.initTheme();
        this.initSidebar();
        this.setupEventListeners();
        await this.loadDatabases();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('lyra_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('lyra_theme', isDark ? 'dark' : 'light');
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const tabId = e.target.getAttribute('data-tab');
                this.activateTab(tabId);
            });
        });

        // Settings modal
        document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('add-database')?.addEventListener('click', () => this.showAddDatabaseForm());

        // Sidebar toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());

        // Sidebar resize
        const resizeHandle = document.getElementById('sidebar-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', e => {
                this.resizing = true;
                document.body.classList.add('resize-active');
                e.preventDefault();
            });

            document.addEventListener('mousemove', e => {
                if (!this.resizing) return;

                const sidebar = document.getElementById('sidebar');
                if (!sidebar) return;

                const newWidth = e.clientX;
                if (newWidth < 150) return; // Minimum width
                if (newWidth > 500) return; // Maximum width

                sidebar.style.width = newWidth + 'px';
            });

            document.addEventListener('mouseup', () => {
                if (this.resizing) {
                    this.resizing = false;
                    document.body.classList.remove('resize-active');
                }
            });
        }
    }

    initSidebar() {
        const sidebarCollapsed = localStorage.getItem('lyra_sidebar_collapsed') === 'true';
        if (sidebarCollapsed) {
            document.getElementById('sidebar')?.classList.add('collapsed');
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('lyra_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    }

    async loadDatabases() {
        try {
            const response = await fetch('/backend/api/list_available_databases.php');
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.databases = data;
            this.renderDatabaseList();
        } catch (error) {
            this.showError('Failed to load databases: ' + error.message);
        }
    }

    renderDatabaseList() {
        const dbList = document.getElementById('database-list');
        if (!dbList) return;

        if (!this.databases.length) {
            dbList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    No database connections found.<br>
                    <button id="add-first-db" class="text-primary hover:underline mt-2">
                        Add your first connection
                    </button>
                </div>
            `;

            document.getElementById('add-first-db')?.addEventListener('click', () => this.openSettings());
            return;
        }

        dbList.innerHTML = this.databases.map(db => `
            <div class="database-item" data-db="${db}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2z"></path>
                    <path d="M2 6.5C2 8.98 6.48 11 12 11s10-2.02 10-4.5"></path>
                    <path d="M2 12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5"></path>
                </svg>
                ${db}
            </div>
        `).join('');

        // Add click event to database items
        document.querySelectorAll('.database-item').forEach(item => {
            item.addEventListener('click', () => {
                const dbName = item.getAttribute('data-db');
                this.selectDatabase(dbName);
            });
        });
    }

    async selectDatabase(database) {
        if (this.currentDatabase === database) return;

        this.currentDatabase = database;
        this.currentTable = null;

        // Update UI to show selection
        document.querySelectorAll('.database-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-db') === database);
        });

        document.getElementById('current-db-name').textContent = database;

        // Dispatch event for other components to react to database change
        const event = new CustomEvent('lyradb:database-changed', {
            detail: { database }
        });
        document.dispatchEvent(event);

        // Load tables for this database
        await this.loadTables(database);
    }

    async loadTables(databaseName) {
        try {
            const response = await fetch(`/backend/api/tables.php?database=${encodeURIComponent(databaseName)}`);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.renderTableList(data);
        } catch (error) {
            this.showError('Failed to load tables: ' + error.message);
        }
    }

    renderTableList(tables) {
        const tableList = document.getElementById('table-list');
        if (!tableList) return;

        if (!tables.length) {
            tableList.innerHTML = `
                <div class="text-gray-500 p-4 text-center text-sm">
                    No tables found in this database
                </div>
            `;
            return;
        }

        tableList.innerHTML = tables.map(table => `
            <div class="table-item" data-table="${table}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3h18v18H3zM3 9h18M9 21V9"></path>
                </svg>
                ${table}
            </div>
        `).join('');

        // Add click event to table items
        document.querySelectorAll('.table-item').forEach(item => {
            item.addEventListener('click', () => {
                const tableName = item.getAttribute('data-table');
                this.selectTable(tableName);
            });
        });
    }

    async selectTable(tableName) {
        if (this.currentTable === tableName) return;

        this.currentTable = tableName;

        // Update UI to show selection
        document.querySelectorAll('.table-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-table') === tableName);
        });

        // Load table structure and preview
        await this.loadTableStructure(tableName);
        await this.loadTablePreview(tableName);
    }

    activateTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            const contentId = 'tab-' + tabId;
            content.classList.toggle('hidden', content.id !== contentId);
        });
    }

    async loadTableStructure(tableName) {
        if (!this.currentDatabase) return;

        try {
            const response = await fetch(`/backend/api/structure.php?database=${encodeURIComponent(this.currentDatabase)}&table=${encodeURIComponent(tableName)}`);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.renderTableStructure(data);
        } catch (error) {
            this.showError('Failed to load table structure: ' + error.message);
        }
    }

    renderTableStructure(columns) {
        const structureContent = document.getElementById('structure-content');
        if (!structureContent) return;

        if (!columns || !columns.length) {
            structureContent.innerHTML = `
                <div class="text-gray-500 p-4 text-center">
                    No columns found for this table
                </div>
            `;
            return;
        }

        let tableHtml = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Field</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Null</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Key</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Default</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Extra</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
        `;

        columns.forEach((column, i) => {
            tableHtml += `
                <tr class="${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${column.Field}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${column.Type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${column.Null}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${column.Key}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${column.Default === null ? '<span class="text-gray-400 italic">NULL</span>' : column.Default}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${column.Extra}</td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        structureContent.innerHTML = tableHtml;
    }

    async loadTablePreview(tableName) {
        if (!this.currentDatabase) return;

        try {
            const query = `SELECT * FROM \`${tableName}\` LIMIT 100`;
            const response = await fetch('/backend/api/query.php', {
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

            this.renderTablePreview(data.rows);
        } catch (error) {
            this.showError('Failed to load table data: ' + error.message);
        }
    }

    renderTablePreview(rows) {
        const previewContent = document.getElementById('data-content');
        if (!previewContent) return;

        if (!rows || !rows.length) {
            previewContent.innerHTML = `
                <div class="text-gray-500 p-4 text-center">
                    No data found for this table
                </div>
            `;
            return;
        }

        // Get headers from the first row
        const headers = Object.keys(rows[0]);

        let tableHtml = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            ${headers.map(h => `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
        `;

        rows.forEach((row, i) => {
            tableHtml += `<tr class="${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}">`;
            headers.forEach(header => {
                const value = row[header];
                const displayValue = value === null ?
                    '<span class="text-gray-400 italic">NULL</span>' :
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

        previewContent.innerHTML = tableHtml;
    }

    openSettings() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        modal.classList.remove('hidden');

        // Load database connections
        this.loadDatabaseConnections();
    }

    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Remove any open forms
        const form = document.getElementById('db-form');
        if (form) {
            form.remove();
        }
    }

    async loadDatabaseConnections() {
        try {
            const response = await fetch('/backend/api/list_available_databases.php');
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.databases = data;
            this.renderDatabaseConnectionsList();
        } catch (error) {
            this.showError('Failed to load database connections: ' + error.message);
        }
    }

    renderDatabaseConnectionsList() {
        const connectionsList = document.getElementById('db-connections-list');
        if (!connectionsList) return;

        if (!this.databases.length) {
            connectionsList.innerHTML = `
                <div class="text-gray-500 p-4 text-center">
                    No database connections configured.
                </div>
            `;
            return;
        }

        connectionsList.innerHTML = this.databases.map((db, index) => `
            <div class="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                <div>
                    <div class="font-medium">${db.name || db}</div>
                    ${db.host ? `<div class="text-sm text-gray-500 dark:text-gray-400">${db.host}${db.port ? ':' + db.port : ''}</div>` : ''}
                </div>
                <div class="flex gap-2">
                    <button class="btn-icon edit-db-btn" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete-db-btn" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to the edit and delete buttons
        document.querySelectorAll('.edit-db-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.editDatabaseConnection(index);
            });
        });

        document.querySelectorAll('.delete-db-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteDatabaseConnection(index);
            });
        });
    }

    showAddDatabaseForm() {
        const formHtml = `
            <div id="db-form" class="p-4 border rounded dark:border-gray-700 mt-4">
                <h3 class="text-lg font-medium mb-4">Add Database Connection</h3>
                <div class="form-group">
                    <label for="db-name" class="form-label">Connection Name</label>
                    <input type="text" id="db-name" class="input-field" placeholder="My Database">
                </div>
                <div class="form-group">
                    <label for="db-host" class="form-label">Host</label>
                    <input type="text" id="db-host" class="input-field" placeholder="localhost">
                </div>
                <div class="form-group">
                    <label for="db-port" class="form-label">Port (optional)</label>
                    <input type="text" id="db-port" class="input-field" placeholder="3306">
                </div>
                <div class="form-group">
                    <label for="db-user" class="form-label">Username</label>
                    <input type="text" id="db-user" class="input-field" placeholder="root">
                </div>
                <div class="form-group">
                    <label for="db-pass" class="form-label">Password</label>
                    <input type="password" id="db-pass" class="input-field">
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button id="cancel-db-form" class="btn btn-secondary">Cancel</button>
                    <button id="save-db-form" class="btn btn-primary">Save Connection</button>
                </div>
            </div>
        `;

        // Add form to the modal
        const connectionsArea = document.getElementById('db-connections-list').parentElement;
        const existingForm = document.getElementById('db-form');

        if (existingForm) {
            existingForm.remove();
        }

        connectionsArea.insertAdjacentHTML('beforeend', formHtml);

        // Setup event listeners
        document.getElementById('cancel-db-form').addEventListener('click', () => {
            document.getElementById('db-form').remove();
        });

        document.getElementById('save-db-form').addEventListener('click', async () => {
            await this.saveNewDatabaseConnection();
        });
    }

    async saveNewDatabaseConnection() {
        const name = document.getElementById('db-name').value;
        const host = document.getElementById('db-host').value;
        const port = document.getElementById('db-port').value || '3306';
        const user = document.getElementById('db-user').value;
        const pass = document.getElementById('db-pass').value;

        if (!name || !host || !user) {
            this.showError('Name, host, and username are required');
            return;
        }

        try {
            const response = await fetch('/backend/api/add_database.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    host,
                    port,
                    user,
                    pass
                })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.showNotification('Database connection added successfully');
            document.getElementById('db-form').remove();

            // Refresh the connections list
            this.loadDatabaseConnections();

            // Also refresh the main database list
            this.loadDatabases();
        } catch (error) {
            this.showError('Failed to add database connection: ' + error.message);
        }
    }

    editDatabaseConnection(index) {
        const db = this.databases[index];
        if (!db) return;

        // Show form with pre-filled data
        const formHtml = `
            <div id="db-form" class="p-4 border rounded dark:border-gray-700 mt-4">
                <h3 class="text-lg font-medium mb-4">Edit Database Connection</h3>
                <input type="hidden" id="db-index" value="${index}">
                <input type="hidden" id="db-id" value="${db.id || ''}">
                <div class="form-group">
                    <label for="db-name" class="form-label">Connection Name</label>
                    <input type="text" id="db-name" class="input-field" value="${db.name || db}" placeholder="My Database">
                </div>
                <div class="form-group">
                    <label for="db-host" class="form-label">Host</label>
                    <input type="text" id="db-host" class="input-field" value="${db.host || ''}" placeholder="localhost">
                </div>
                <div class="form-group">
                    <label for="db-port" class="form-label">Port (optional)</label>
                    <input type="text" id="db-port" class="input-field" value="${db.port || ''}" placeholder="3306">
                </div>
                <div class="form-group">
                    <label for="db-user" class="form-label">Username</label>
                    <input type="text" id="db-user" class="input-field" value="${db.user || ''}" placeholder="root">
                </div>
                <div class="form-group">
                    <label for="db-pass" class="form-label">Password</label>
                    <input type="password" id="db-pass" class="input-field" placeholder="Leave empty to keep current password">
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button id="cancel-db-form" class="btn btn-secondary">Cancel</button>
                    <button id="save-edit-db-form" class="btn btn-primary">Update Connection</button>
                </div>
            </div>
        `;

        // Add form to the modal
        const connectionsArea = document.getElementById('db-connections-list').parentElement;
        const existingForm = document.getElementById('db-form');

        if (existingForm) {
            existingForm.remove();
        }

        connectionsArea.insertAdjacentHTML('beforeend', formHtml);

        // Setup event listeners
        document.getElementById('cancel-db-form').addEventListener('click', () => {
            document.getElementById('db-form').remove();
        });

        document.getElementById('save-edit-db-form').addEventListener('click', async () => {
            await this.updateDatabaseConnection();
        });
    }

    async updateDatabaseConnection() {
        const index = parseInt(document.getElementById('db-index').value);
        const id = document.getElementById('db-id').value;
        const name = document.getElementById('db-name').value;
        const host = document.getElementById('db-host').value;
        const port = document.getElementById('db-port').value || '3306';
        const user = document.getElementById('db-user').value;
        const pass = document.getElementById('db-pass').value;

        if (!name || !host || !user) {
            this.showError('Name, host, and username are required');
            return;
        }

        try {
            const response = await fetch('/backend/api/update_database.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    name,
                    host,
                    port,
                    user,
                    pass: pass || null
                })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.showNotification('Database connection updated successfully');
            document.getElementById('db-form').remove();

            // Refresh the connections list
            this.loadDatabaseConnections();

            // Also refresh the main database list
            this.loadDatabases();
        } catch (error) {
            this.showError('Failed to update database connection: ' + error.message);
        }
    }

    async deleteDatabaseConnection(index) {
        const db = this.databases[index];
        if (!db) return;

        const confirm = window.confirm(`Are you sure you want to delete connection to ${db.name || db}?`);
        if (!confirm) return;

        try {
            const response = await fetch('/backend/api/delete_database.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: db.id
                })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.showNotification('Database connection deleted successfully');

            // Refresh the connections list
            this.loadDatabaseConnections();

            // Also refresh the main database list
            this.loadDatabases();
        } catch (error) {
            this.showError('Failed to delete database connection: ' + error.message);
        }
    }

    async getAvailableDatabases(connectionId) {
        try {
            const url = connectionId
                ? `/backend/api/list_available_databases.php?connection_id=${encodeURIComponent(connectionId)}`
                : '/backend/api/list_available_databases.php';

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return [];
            }

            return data;
        } catch (error) {
            this.showError('Failed to fetch available databases: ' + error.message);
            return [];
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${LyraUtils.escapeHtml(message)}</div>
            </div>
            <button class="btn-icon notification-close">×</button>
        `;

        const container = document.querySelector('.notification-container') || createNotificationContainer();
        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Set up close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        function createNotificationContainer() {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            return container;
        }
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${LyraUtils.escapeHtml(message)}</div>
            </div>
            <button class="btn-icon notification-close">×</button>
        `;

        const container = document.querySelector('.notification-container') || createNotificationContainer();
        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Set up close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        function createNotificationContainer() {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            return container;
        }
    }

    initResizableSidebar() {
        const sidebar = document.getElementById('sidebar');
        const handle = document.getElementById('sidebar-resize-handle');

        if (!sidebar || !handle) return;

        let isResizing = false;
        let startX, startWidth;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);

            document.body.classList.add('resize-active');

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + (e.clientX - startX);

            // Set min and max width
            if (width >= 180 && width <= 500) {
                sidebar.style.width = `${width}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resize-active');

                // Save sidebar width to localStorage
                localStorage.setItem('lyradb_sidebar_width', sidebar.style.width);
            }
        });

        // Restore saved width
        const savedWidth = localStorage.getItem('lyradb_sidebar_width');
        if (savedWidth) {
            sidebar.style.width = savedWidth;
        }
    }

    async showDatabaseSelector(connectionId) {
        try {
            const availableDatabases = await this.getAvailableDatabases(connectionId);

            if (!availableDatabases || availableDatabases.length === 0) {
                this.showError('No databases available for this connection');
                return;
            }

            const selectHtml = `
                <div id="database-selector" class="p-4">
                    <h3 class="text-lg font-medium mb-4">Select Database</h3>
                    <div class="form-group">
                        <label for="available-databases" class="form-label">Available Databases:</label>
                        <select id="available-databases" class="input-field">
                            <option value="">-- Select a database --</option>
                            ${availableDatabases.map(db => `<option value="${LyraUtils.escapeHtml(db)}">${LyraUtils.escapeHtml(db)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button id="cancel-db-select" class="btn btn-secondary mr-2">Cancel</button>
                        <button id="confirm-db-select" class="btn btn-primary">Select</button>
                    </div>
                </div>
            `;

            // Add selector to the modal
            const connectionsArea = document.getElementById('db-connections-list').parentElement;
            const existingSelector = document.getElementById('database-selector');
            const existingForm = document.getElementById('db-form');

            if (existingSelector) {
                existingSelector.remove();
            }

            if (existingForm) {
                existingForm.remove();
            }

            connectionsArea.insertAdjacentHTML('beforeend', selectHtml);

            // Setup event listeners
            document.getElementById('cancel-db-select').addEventListener('click', () => {
                document.getElementById('database-selector').remove();
            });

            document.getElementById('confirm-db-select').addEventListener('click', () => {
                const dbSelect = document.getElementById('available-databases');
                const selectedDb = dbSelect.value;

                if (selectedDb) {
                    this.selectDatabase(selectedDb);
                    this.closeSettings();
                } else {
                    this.showError('Please select a database');
                }
            });

        } catch (error) {
            this.showError(`Failed to load available databases: ${error.message}`);
        }
    }

    updateUIForSelectedDatabase(databaseName) {
        // Update the current database name in the sidebar
        const dbNameEl = document.getElementById('current-db-name');
        if (dbNameEl) {
            dbNameEl.textContent = databaseName;
        }

        // Update window title
        document.title = `${databaseName} - ${APP_NAME}`;

        // Reset query editor if needed
        const queryResults = document.getElementById('query-results');
        if (queryResults) {
            queryResults.innerHTML = '<div class="placeholder">Execute a query to see results</div>';
        }

        // Dispatch event for other components that need to know about database change
        document.dispatchEvent(new CustomEvent('lyradb:database-changed', {
            detail: { database: databaseName }
        }));
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lyraApp = new LyraDB();
});

// Export module for potential use with bundlers
export default LyraDB;