<?php
class Database {
    private $pdo;
    private $configFile;

    public function __construct() {
        $this->configFile = CONFIG_FILE;
        $this->ensureConfigExists();
    }

    private function ensureConfigExists() {
        if (!file_exists($this->configFile)) {
            file_put_contents($this->configFile, json_encode([]));
            chmod($this->configFile, 0600); // Secure permissions
        }
    }

    private function loadDatabaseConfigurations() {
        $content = file_get_contents($this->configFile);
        return json_decode($content, true) ?: [];
    }

    private function saveDatabaseConfigurations($configurations) {
        file_put_contents($this->configFile, json_encode($configurations, JSON_PRETTY_PRINT));
    }

    public function getAllDatabases() {
        $databases = $this->loadDatabaseConfigurations();
        // Remove sensitive information
        foreach ($databases as &$db) {
            unset($db['pass']);
        }
        return $databases;
    }

    public function addDatabaseConnection($name, $host, $port, $user, $pass) {
        $databases = $this->loadDatabaseConfigurations();

        // Validate connection before adding
        try {
            $dsn = "mysql:host={$host};";
            if (!empty($port)) {
                $dsn .= "port={$port};";
            }
            $dsn .= "charset=utf8mb4";

            $testPdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5 // 5 second timeout
            ]);

            // Test if we can get list of databases
            $stmt = $testPdo->query('SHOW DATABASES');
            $stmt->fetchAll(); // Just to check if query works

        } catch (PDOException $e) {
            throw new Exception("Connection failed: " . $e->getMessage());
        }

        $id = uniqid('db_');
        $databases[] = [
            'id' => $id,
            'name' => $name,
            'host' => $host,
            'port' => $port,
            'user' => $user,
            'pass' => $pass
        ];
        $this->saveDatabaseConfigurations($databases);
        return $id;
    }

    public function updateDatabaseConnection($id, $name, $host, $port, $user, $pass = null) {
        $databases = $this->loadDatabaseConfigurations();
        $updated = false;
        $originalConfig = null;

        foreach ($databases as &$db) {
            if ($db['id'] === $id) {
                $originalConfig = $db;
                $db['name'] = $name;
                $db['host'] = $host;
                $db['port'] = $port;
                $db['user'] = $user;
                if ($pass !== null) {
                    $db['pass'] = $pass;
                }
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            throw new Exception("Database configuration not found");
        }

        // Test the updated connection
        try {
            $testPass = ($pass !== null) ? $pass : $originalConfig['pass'];
            $dsn = "mysql:host={$host};";
            if (!empty($port)) {
                $dsn .= "port={$port};";
            }
            $dsn .= "charset=utf8mb4";

            $testPdo = new PDO($dsn, $user, $testPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);

            $stmt = $testPdo->query('SHOW DATABASES');
            $stmt->fetchAll();

        } catch (PDOException $e) {
            throw new Exception("Connection failed: " . $e->getMessage());
        }

        $this->saveDatabaseConfigurations($databases);
        return true;
    }

    public function deleteDatabaseConnection($id) {
        $databases = $this->loadDatabaseConfigurations();
        $filtered = array_filter($databases, function ($db) use ($id) {
            return $db['id'] !== $id;
        });
        $this->saveDatabaseConfigurations(array_values($filtered));
        return true;
    }

    public function connect($databaseName) {
        $databases = $this->loadDatabaseConfigurations();
        $config = null;

        foreach ($databases as $db) {
            if ($db['name'] === $databaseName) {
                $config = $db;
                break;
            }
        }

        if (!$config) {
            throw new Exception("Database configuration not found");
        }

        try {
            $dsn = "mysql:host={$config['host']};";
            if (!empty($config['port'])) {
                $dsn .= "port={$config['port']};";
            }
            $dsn .= "charset=utf8mb4";

            $this->pdo = new PDO($dsn, $config['user'], $config['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);

            return $this->pdo;
        } catch (PDOException $e) {
            throw new Exception("Connection failed: " . $e->getMessage());
        }
    }

    public function getTables($databaseName) {
        $this->connect($databaseName);
        try {
            $this->pdo->exec("USE `$databaseName`");
            $stmt = $this->pdo->query('SHOW TABLES');
            $tables = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            return $tables;
        } catch (PDOException $e) {
            throw new Exception("Failed to get tables: " . $e->getMessage());
        }
    }

    public function getTableStructure($databaseName, $tableName) {
        $this->connect($databaseName);
        try {
            $this->pdo->exec("USE `$databaseName`");
            $stmt = $this->pdo->query("DESCRIBE `$tableName`");
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Failed to get table structure: " . $e->getMessage());
        }
    }

    public function executeQuery($databaseName, $query) {
        $this->connect($databaseName);
        try {
            $this->pdo->exec("USE `$databaseName`");
            $startTime = microtime(true);
            $stmt = $this->pdo->query($query);
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2); // in ms

            $queryType = strtoupper(substr(trim($query), 0, 6));
            if ($queryType === 'SELECT') {
                $rows = $stmt->fetchAll();
                return [
                    'rows' => $rows,
                    'affectedRows' => count($rows),
                    'executionTime' => $executionTime
                ];
            } else {
                return [
                    'affectedRows' => $stmt->rowCount(),
                    'message' => "Query executed successfully",
                    'executionTime' => $executionTime
                ];
            }
        } catch (PDOException $e) {
            throw new Exception($e->getMessage());
        }
    }

    public function getAvailableDatabases($connectionId = null) {
        if ($connectionId) {
            // Get specific connection
            $databases = $this->loadDatabaseConfigurations();
            $config = null;

            foreach ($databases as $db) {
                if ($db['id'] === $connectionId) {
                    $config = $db;
                    break;
                }
            }

            if (!$config) {
                throw new Exception("Database connection not found");
            }

            try {
                $dsn = "mysql:host={$config['host']};";
                if (!empty($config['port'])) {
                    $dsn .= "port={$config['port']};";
                }
                $dsn .= "charset=utf8mb4";

                $tempPdo = new PDO($dsn, $config['user'], $config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);

                $stmt = $tempPdo->query('SHOW DATABASES');
                $dbs = [];
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    // Skip system databases
                    if (!in_array($row[0], ['information_schema', 'mysql', 'performance_schema', 'sys'])) {
                        $dbs[] = $row[0];
                    }
                }
                return $dbs;
            } catch (PDOException $e) {
                throw new Exception("Failed to retrieve databases: " . $e->getMessage());
            }
        } else {
            // Return all configured database names
            $databases = $this->loadDatabaseConfigurations();
            $dbNames = [];

            foreach ($databases as $db) {
                $dbNames[] = $db['name'];
            }

            return $dbNames;
        }
    }
}