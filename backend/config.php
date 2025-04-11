<?php
// Error reporting settings
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set timezone
date_default_timezone_set('UTC');

// Define constants
define('APP_NAME', 'LyraDB');
define('APP_VERSION', '1.0.0-ALPHA');
define('CONFIG_FILE', __DIR__ . '/databases.json');

// Security headers
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

// Session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'cookie_samesite' => 'Lax',
    'use_strict_mode' => true
]);

// Custom error handler
function appErrorHandler($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }

    $errorType = 'Unknown Error';
    switch ($errno) {
        case E_ERROR: $errorType = 'Fatal Error'; break;
        case E_WARNING: $errorType = 'Warning'; break;
        case E_PARSE: $errorType = 'Parse Error'; break;
        case E_NOTICE: $errorType = 'Notice'; break;
        case E_CORE_ERROR: $errorType = 'Core Error'; break;
        case E_CORE_WARNING: $errorType = 'Core Warning'; break;
        case E_COMPILE_ERROR: $errorType = 'Compile Error'; break;
        case E_COMPILE_WARNING: $errorType = 'Compile Warning'; break;
        case E_USER_ERROR: $errorType = 'User Error'; break;
        case E_USER_WARNING: $errorType = 'User Warning'; break;
        case E_USER_NOTICE: $errorType = 'User Notice'; break;
        case E_STRICT: $errorType = 'Runtime Notice'; break;
        case E_RECOVERABLE_ERROR: $errorType = 'Catchable Fatal Error'; break;
        case E_DEPRECATED: $errorType = 'Deprecated'; break;
        case E_USER_DEPRECATED: $errorType = 'User Deprecated'; break;
    }

    // Log error
    error_log("$errorType: $errstr in $errfile on line $errline");

    // Only show error message in API responses if in debug mode
    if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'An error occurred. Please try again later.']);
        exit;
    }

    return true;
}

set_error_handler('appErrorHandler');