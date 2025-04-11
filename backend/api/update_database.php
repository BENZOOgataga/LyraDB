<?php
require_once '../config.php';
require_once '../database.php';

header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id']) || !isset($input['name']) || !isset($input['host']) || !isset($input['user'])) {
    echo json_encode(['error' => 'ID, name, host, and username are required']);
    exit;
}

$id = $input['id'];
$name = $input['name'];
$host = $input['host'];
$port = isset($input['port']) ? $input['port'] : '3306';
$user = $input['user'];
$pass = isset($input['pass']) ? $input['pass'] : null;

try {
    $db = new Database();
    $result = $db->updateDatabaseConnection($id, $name, $host, $port, $user, $pass);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}