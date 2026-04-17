<?php

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config.php';
if (!empty($config['session_name'])) {
    session_name($config['session_name']);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require __DIR__ . '/db.php';

function read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        return [];
    }

    return $data;
}

function send_json($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function is_valid_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
