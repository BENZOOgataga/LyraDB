<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['database']) || !isset($input['query'])) {
    echo json_encode(['error' => 'Database name and query are required']);
    exit;
}

$databaseName = $input['database'];
$query = $input['query'];

try {
    $db = new Database();
    $result = $db->executeQuery($databaseName, $query);
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}