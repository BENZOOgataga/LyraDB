<?php
session_start();
if (!isset($_SESSION['username'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['sql'])) {
    echo json_encode(['error' => 'No SQL provided']);
    exit;
}

$query = $_POST['sql'];
$conn = new mysqli(TARGET_DB_HOST, TARGET_DB_USER, TARGET_DB_PASS, TARGET_DB_NAME);

if ($conn->connect_error) {
    echo json_encode(['error' => 'Target DB connection error: ' . $conn->connect_error]);
    exit;
}

$result = $conn->query($query);

if ($result === false) {
    echo json_encode(['error' => $conn->error]);
    $conn->close();
    exit;
}

$data = [];
if ($result instanceof mysqli_result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    $result->free();
} else {
    $data = ['affected_rows' => $conn->affected_rows];
}

$conn->close();
echo json_encode(['data' => $data]);
?>