<?php
session_start();
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: login.php");
    exit;
}

$conn = new mysqli(INTERNAL_DB_HOST, INTERNAL_DB_USER, INTERNAL_DB_PASS, INTERNAL_DB_NAME);

if ($conn->connect_error) {
    die("Connection error: " . $conn->connect_error);
}

$username = $conn->real_escape_string($_POST['username']);
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE username = '$username' LIMIT 1";
$result = $conn->query($sql);

if ($result && $result->num_rows === 1) {
    $row = $result->fetch_assoc();
    if (password_verify($password, $row['password'])) {
        $_SESSION['username'] = $username;
        header("Location: ../../index.php");
        exit;
    }
}

$conn->close();
header("Location: login.php?error=Invalid credentials");
exit;