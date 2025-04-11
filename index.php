<?php
session_start();
if (!isset($_SESSION['username'])) {
    header("Location: backend/api/login.php");
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LyraDB</title>
    <link rel="stylesheet" href="frontend/css/styles.css">
</head>
<body>
<div class="header">
    <h2>LyraDB - Database Visualizer</h2>
    <a href="logout.php" class="logout">Logout</a>
</div>
<div class="query-container">
    <textarea id="sqlQuery" placeholder="Enter your SQL query here"></textarea>
    <button id="runQuery">Run Query</button>
    <div id="errorBox" class="error-box" style="display:none;"></div>
</div>
<div class="result-container">
    <table id="resultTable">
        <thead></thead>
        <tbody></tbody>
    </table>
</div>
<script src="frontend/js/script.js"></script>
</body>
</html>