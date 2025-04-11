CREATE DATABASE IF NOT EXISTS lyradb;
USE lyradb;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

INSERT INTO users (username, password)
VALUES (
  'admin',
  -- Use PHP to hash the password before insertion. Replace PHP_HASHED_PASSWORD with the actual hash output.
  '$2y$10$DCmsVfMLsQ6rU6ymeJmVneLqMh0fWJSJ3gvLnZa8ZWQOfr.K4vua2'
);