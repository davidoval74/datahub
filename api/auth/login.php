<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

$input = read_json_body();
$email = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');
$recaptcha_token = (string)($input['recaptcha_token'] ?? '');

if (!is_valid_email($email) || $password === '') {
    send_json(400, ['ok' => false, 'message' => 'Credenciais invalidas.']);
}

// Validar reCAPTCHA
if (!validate_recaptcha($recaptcha_token)) {
    send_json(429, ['ok' => false, 'message' => 'Validacao reCAPTCHA falhou. Tente novamente.']);
}

try {
    $stmt = $mysqli->prepare('SELECT id, name, email, password_hash, status FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->bind_result($userId, $userName, $userEmail, $passwordHash, $status);
    $found = $stmt->fetch();
    $stmt->close();

    if (!$found || $status !== 'active') {
        send_json(401, ['ok' => false, 'message' => 'Email ou senha incorretos.']);
    }

    if (!password_verify($password, $passwordHash)) {
        send_json(401, ['ok' => false, 'message' => 'Email ou senha incorretos.']);
    }

    $_SESSION['auth_user'] = [
        'id' => (int)$userId,
        'name' => $userName,
        'email' => $userEmail
    ];

    send_json(200, [
        'ok' => true,
        'message' => 'Login realizado com sucesso.',
        'user' => $_SESSION['auth_user']
    ]);
} catch (Throwable $e) {
    send_json(500, ['ok' => false, 'message' => 'Falha ao autenticar.']);
}
