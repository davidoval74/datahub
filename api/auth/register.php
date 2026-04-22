<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

$input = read_json_body();
$name = trim((string)($input['name'] ?? ''));
$email = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');
$recaptcha_token = (string)($input['recaptcha_token'] ?? '');

if (strlen($name) < 3) {
    send_json(400, ['ok' => false, 'message' => 'Nome deve ter pelo menos 3 caracteres.']);
}

if (!is_valid_email($email)) {
    send_json(400, ['ok' => false, 'message' => 'Email invalido.']);
}

if (strlen($password) < 8) {
    send_json(400, ['ok' => false, 'message' => 'Senha deve ter no minimo 8 caracteres.']);
}

// Validar reCAPTCHA
if (!validate_recaptcha($recaptcha_token)) {
    send_json(429, ['ok' => false, 'message' => 'Validacao reCAPTCHA falhou. Tente novamente.']);
}

try {
    $stmt = $mysqli->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->bind_result($existingId);
    $existing = $stmt->fetch();
    $stmt->close();

    if ($existing) {
        send_json(409, ['ok' => false, 'message' => 'Ja existe conta com este email.']);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $mysqli->prepare('INSERT INTO users (name, email, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())');
    $status = 'active';
    $stmt->bind_param('ssss', $name, $email, $hash, $status);
    $stmt->execute();
    $userId = $stmt->insert_id;
    $stmt->close();

    $_SESSION['auth_user'] = [
        'id' => $userId,
        'name' => $name,
        'email' => $email
    ];

    send_json(201, [
        'ok' => true,
        'message' => 'Cadastro realizado com sucesso.',
        'user' => $_SESSION['auth_user']
    ]);
} catch (Throwable $e) {
    send_json(500, ['ok' => false, 'message' => 'Falha ao criar cadastro.']);
}
