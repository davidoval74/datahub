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
    $secretKey = '6LfWz8QsAAAAACN4aqhbP3Ea_6cujk5gZ8uuqm5u';

    if ($token === '') {
        return [
            'ok' => false,
            'message' => 'Token do reCAPTCHA nao recebido.',
            'errorCodes' => ['missing-input-response']
        ];
    }

    $payload = [
        'secret' => $secretKey,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
    ];

    try {
        $response = null;
        $transportError = null;

        if (function_exists('curl_init')) {
            $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($payload),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            ]);

            $response = curl_exec($ch);
            if ($response === false) {
                $transportError = curl_error($ch);
            }
            curl_close($ch);
        }

        if ($response === null) {
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                    'content' => http_build_query($payload),
                    'timeout' => 10
                ]
            ]);

            $response = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
            if ($response === false) {
                $transportError = 'Falha ao conectar no endpoint do Google reCAPTCHA.';
            }
        }

        if ($response === false || $response === null) {
            return [
                'ok' => false,
                'message' => 'Nao foi possivel validar o reCAPTCHA com o Google.',
                'errorCodes' => $transportError ? [$transportError] : []
            ];
        }

        $result = json_decode($response, true);
        if (!is_array($result)) {
            return [
                'ok' => false,
                'message' => 'Resposta invalida do Google reCAPTCHA.',
                'errorCodes' => []
            ];
        }

        if (!empty($result['success'])) {
            return [
                'ok' => true,
                'message' => 'reCAPTCHA validado com sucesso.',
                'errorCodes' => []
            ];
        }

        $errorCodes = [];
        if (!empty($result['error-codes']) && is_array($result['error-codes'])) {
            $errorCodes = $result['error-codes'];
        }

        return [
            'ok' => false,
            'message' => 'Google rejeitou o token do reCAPTCHA.',
            'errorCodes' => $errorCodes
        ];
    } catch (Throwable $e) {
        return [
            'ok' => false,
            'message' => 'Erro interno ao validar o reCAPTCHA.',
            'errorCodes' => [$e->getMessage()]
        ];
    }
}
