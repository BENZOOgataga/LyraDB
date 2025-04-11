<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

if (!isset($_GET['database'])) {
    echo json_encode(['error' => 'Database name is required']);
    exit;
}

$databaseName = $_GET['database'];

try {
    $db = new Database();
    $tables = $db->getTables($databaseName);
    echo json_encode($tables);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}