<?php

$config = require __DIR__ . '/config.php';

if (!extension_loaded('mysqli')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'message' => 'Extensao mysqli nao esta habilitada no servidor PHP.'
    ]);
    exit;
}

if (
    $config['db_name'] === 'cpanel_database_name' ||
    $config['db_user'] === 'cpanel_database_user' ||
    $config['db_pass'] === 'cpanel_database_password'
) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'message' => 'Configure o arquivo api/config.php com os dados reais do cPanel.'
    ]);
    exit;
}

if (defined('MYSQLI_REPORT_ERROR') && defined('MYSQLI_REPORT_STRICT')) {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
}

try {
    $mysqli = new mysqli(
        $config['db_host'],
        $config['db_user'],
        $config['db_pass'],
        $config['db_name'],
        (int) $config['db_port']
    );
    $mysqli->set_charset('utf8mb4');
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'message' => 'Falha na conexao com o banco de dados.',
        'errorCode' => $e->getCode()
    ]);
    exit;
}
