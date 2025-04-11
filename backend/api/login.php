<?php
session_start();
if (isset($_SESSION['username'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LyraDB Login</title>
    <link rel="stylesheet" href="../../frontend/css/styles.css">
</head>
<body>
<div class="login-container">
    <h2>Login</h2>
    <form method="POST" action="auth.php">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        <button type="submit">Log In</button>
    </form>
</div>
</body>
</html>