<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

// Get connection ID if available
$connectionId = isset($_GET['connection_id']) ? $_GET['connection_id'] : null;

try {
    $db = new Database();
    $databases = $db->getAvailableDatabases($connectionId);
    echo json_encode($databases);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}