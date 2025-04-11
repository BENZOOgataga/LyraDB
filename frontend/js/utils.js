/**
 * LyraDB - Utility Functions
 * A collection of helper functions used across the frontend application
 */

class LyraUtils {
    /**
     * Shows a notification toast
     * @param {string} message - The message to display
     * @param {string} type - The notification type (success, error, info, warning)
     * @param {number} duration - Duration in ms before auto-hide (0 for no auto-hide)
     */
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="btn-icon notification-close">×</button>
    `;

        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Set up close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.dismissNotification(notification);
        });

        // Auto remove after specified duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Dismisses a notification with animation
     * @param {HTMLElement} notification - The notification element to dismiss
     */
    static dismissNotification(notification) {
        if (!notification.parentNode) return;
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }

    /**
     * Creates notification container if it doesn't exist
     * @returns {HTMLElement} The notification container
     */
    static createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Show a loading spinner on an element
     * @param {HTMLElement} element - The element to show loading state on
     * @param {string} text - Optional loading text
     */
    static showLoading(element, text = 'Loading...') {
        // Store original content
        if (!element._originalContent) {
            element._originalContent = element.innerHTML;
        }

        // Add disabled attribute if it's a form element
        if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
            element.disabled = true;
        }

        element.classList.add('loading');
        element.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      ${text}
    `;
    }

    /**
     * Hide loading spinner and restore original content
     * @param {HTMLElement} element - The element to hide loading state from
     */
    static hideLoading(element) {
        if (element._originalContent) {
            element.innerHTML = element._originalContent;
            delete element._originalContent;
        }

        if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
            element.disabled = false;
        }

        element.classList.remove('loading');
    }

    /**
     * Makes an AJAX request
     * @param {string} url - The URL to request
     * @param {Object} options - Request options
     * @returns {Promise} A promise resolving to the response data
     */
    static async fetchData(url, options = {}) {
        const defaults = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        };

        const mergedOptions = { ...defaults, ...options };

        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            mergedOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, mergedOptions);
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Request failed with status ${response.status}`);
                }

                return data;
            } else {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                return await response.text();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    /**
     * Validates an email address
     * @param {string} email - The email to validate
     * @returns {boolean} True if valid
     */
    static isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Validates a database connection host
     * @param {string} host - The host to validate
     * @returns {boolean} True if valid
     */
    static isValidHost(host) {
        // Allow hostnames and IP addresses
        return /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$|^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(host);
    }

    /**
     * Validates a port number
     * @param {string|number} port - The port to validate
     * @returns {boolean} True if valid
     */
    static isValidPort(port) {
        const portNum = parseInt(port, 10);
        return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
    }

    /**
     * Escapes HTML to prevent XSS
     * @param {string} html - String to escape
     * @returns {string} Escaped string
     */
    static escapeHtml(html) {
        if (html === null || html === undefined) return '';

        const div = document.createElement('div');
        div.textContent = String(html);
        return div.innerHTML;
    }

    /**
     * Format date in a user-friendly way
     * @param {string|Date} dateString - Date to format
     * @returns {string} Formatted date
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    static formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create a debounce function to limit execution frequency
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Create a throttle function to limit execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    static throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Parse SQL error messages to make them more user-friendly
     * @param {string} error - The SQL error message
     * @returns {string} User-friendly error message
     */
    static parseSQLError(error) {
        if (!error) return 'An unknown error occurred';

        // Extract error code if present
        const codeMatch = error.match(/^ERROR\s+(\d+)/i);
        const code = codeMatch ? codeMatch[1] : null;

        // Make common error messages more user-friendly
        if (error.includes('Access denied for user')) {
            return 'Access denied. Please check your username and password.';
        } else if (error.includes('Unknown database')) {
            return 'Database does not exist or cannot be accessed.';
        } else if (error.includes('Table') && error.includes('doesn\'t exist')) {
            return 'The table referenced in your query does not exist.';
        } else if (error.includes('syntax error')) {
            return 'SQL syntax error. Please check your query.';
        }

        return error;
    }

    /**
     * Simple syntax highlighting for SQL
     * @param {string} sql - SQL code to highlight
     * @returns {string} HTML with syntax highlighting
     */
    static highlightSQL(sql) {
        if (!sql) return '';

        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
            'CREATE', 'ALTER', 'DROP', 'TABLE', 'DATABASE', 'VIEW', 'INDEX',
            'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'ON',
            'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
            'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS',
            'NULL', 'TRUE', 'FALSE', 'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UNION', 'ALL'
        ];

        let highlighted = this.escapeHtml(sql);

        // Highlight keywords
        keywords.forEach(keyword => {
            const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
            highlighted = highlighted.replace(regex, match =>
                `<span class="sql-keyword">${match}</span>`
            );
        });

        // Highlight strings
        highlighted = highlighted.replace(/(["'])(.*?)(\1)/g,
            '<span class="sql-string">$1$2$3</span>'
        );

        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g,
            '<span class="sql-number">$1</span>'
        );

        // Highlight comments
        highlighted = highlighted.replace(/(--.*$)/gm,
            '<span class="sql-comment">$1</span>'
        );

        return highlighted;
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Result of the operation
     */
    static async copyToClipboard(text) {
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Failed to copy text: ', err);
                return false;
            }
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                console.error('Failed to copy text: ', err);
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Get system dark mode preference
     * @returns {boolean} True if system prefers dark mode
     */
    static prefersDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Download data as a file
     * @param {string} content - The content to download
     * @param {string} fileName - The file name
     * @param {string} contentType - The content type
     */
    static downloadFile(content, fileName, contentType = 'text/plain') {
        const a = document.createElement('a');
        const file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}

// Export the utility class
window.LyraUtils = LyraUtils;
export default LyraUtils;