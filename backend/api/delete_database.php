<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'])) {
    echo json_encode(['error' => 'Database ID is required']);
    exit;
}

$id = $input['id'];

try {
    $db = new Database();
    $result = $db->deleteDatabaseConnection($id);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}