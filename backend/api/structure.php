<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

if (!isset($_GET['database']) || !isset($_GET['table'])) {
    echo json_encode(['error' => 'Database and table names are required']);
    exit;
}

$databaseName = $_GET['database'];
$tableName = $_GET['table'];

try {
    $db = new Database();
    $structure = $db->getTableStructure($databaseName, $tableName);
    echo json_encode($structure);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}