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

function validate_recaptcha($token) {
    $secret_key = '***RECAPTCHA_SECRET_REMOVED***';
    
    if (empty($token)) {
        return false;
    }
    
    try {
        $response = file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-type: application/x-www-form-urlencoded',
                'content' => http_build_query([
                    'secret' => $secret_key,
                    'response' => $token
                ]),
                'timeout' => 5
            ]
        ]));
        
        if ($response === false) {
            return false;
        }
        
        $result = json_decode($response, true);
        
        // reCAPTCHA v2 retorna apenas success (true/false)
        if (isset($result['success']) && $result['success'] === true) {
            return true;
        }
        
        return false;
    } catch (Throwable $e) {
        return false;
    }
}
