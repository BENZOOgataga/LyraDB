<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LyraDB</title>
    <link rel="stylesheet" href="frontend/css/styles.css">
    <link rel="stylesheet" href="frontend/css/codemirror-lyra.css">
    <link rel="stylesheet" href="frontend/vendors/codemirror/codemirror.css">
    <script src="frontend/vendors/codemirror/codemirror.js"></script>
    <script src="frontend/vendors/codemirror/mode/sql/sql.js"></script>
</head>
<body class="dark">
<div class="app-container">
    <header class="app-header">
        <div class="logo">
            <h1>LyraDB <span class="version">v1.0.0-alpha</span></h1>
        </div>
        <div class="header-controls">
            <button id="theme-toggle" class="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </button>
            <button id="settings-btn" class="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>
        </div>
    </header>

    <div class="main-container">
        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-resize-handle" id="sidebar-resize-handle"></div>
            <div class="sidebar-header">
                <h2>Database: <span id="current-db-name">None</span></h2>
            </div>
            <div class="sidebar-content">
                <div class="database-section">
                    <div class="section-header">
                        <h3>Tables</h3>
                    </div>
                    <div id="tables-list" class="tree-list"></div>
                </div>
            </div>
        </aside>

        <!-- Content Area -->
        <main class="content-area">
            <div class="tab-bar">
                <button id="tab-query" class="tab-btn active">Query</button>
                <button id="tab-structure" class="tab-btn">Structure</button>
            </div>
            <div class="tab-content-container">
                <!-- Query Tab -->
                <div id="query-tab" class="tab-content">
                    <div class="sql-editor-container">
                        <div id="editor" class="editor"></div>
                        <div class="editor-toolbar">
                            <button id="query-run-btn" class="btn btn-primary btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Run Query
                            </button>
                        </div>
                    </div>
                    <div id="query-results" class="query-results">
                        <div class="placeholder">Execute a query to see results</div>
                    </div>
                </div>

                <!-- Structure Tab -->
                <div id="structure-tab" class="tab-content hidden">
                    <div id="structure-content" class="content-panel">
                        <div class="placeholder">Select a table to view its structure</div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div class="status-bar">
        <div id="status-message">Ready</div>
        <div id="query-time"></div>
    </div>
</div>

<!-- Settings Modal -->
<div id="settings-modal" class="modal-backdrop">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Settings</h3>
            <button id="close-settings" class="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div>
                <h4 class="text-lg font-medium mb-2">Database Connections</h4>
                <p class="text-sm text-muted mb-4">Manage your database connections</p>

                <div id="db-connections-list" class="mb-4"></div>

                <div>
                    <button id="add-connection-btn" class="btn btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Connection
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="frontend/js/utils.js"></script>
<script src="frontend/js/app.js"></script>
</body>
</html>