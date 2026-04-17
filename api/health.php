<?php
header('Content-Type: application/json; charset=utf-8');

$result = [
    'ok' => true,
    'phpVersion' => PHP_VERSION,
    'checks' => []
];

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Arquivo de configuracao nao encontrado em api/config.php.'
    ]);
    exit;
}

$config = require $configPath;

$result['checks']['configLoaded'] = true;
$result['checks']['mysqliExtension'] = extension_loaded('mysqli');

if (!$result['checks']['mysqliExtension']) {
    $result['ok'] = false;
    $result['checks']['databaseConnection'] = false;
    $result['checks']['usersTable'] = false;
    http_response_code(500);
    echo json_encode($result);
    exit;
}

try {
    $mysqli = new mysqli(
        $config['db_host'] ?? 'localhost',
        $config['db_user'] ?? '',
        $config['db_pass'] ?? '',
        $config['db_name'] ?? '',
        (int)($config['db_port'] ?? 3306)
    );

    if ($mysqli->connect_errno) {
        $result['ok'] = false;
        $result['checks']['databaseConnection'] = false;
        $result['checks']['usersTable'] = false;
        $result['dbError'] = $mysqli->connect_error;
        http_response_code(500);
        echo json_encode($result);
        exit;
    }

    $result['checks']['databaseConnection'] = true;
    $mysqli->set_charset('utf8mb4');

    $tableResult = $mysqli->query("SHOW TABLES LIKE 'users'");
    $tableExists = $tableResult && $tableResult->num_rows > 0;
    $result['checks']['usersTable'] = $tableExists;

    if (!$tableExists) {
        $result['ok'] = false;
        http_response_code(500);
    }

    echo json_encode($result);
    exit;
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['checks']['databaseConnection'] = false;
    $result['checks']['usersTable'] = false;
    $result['exception'] = $e->getMessage();
    http_response_code(500);
    echo json_encode($result);
    exit;
}
