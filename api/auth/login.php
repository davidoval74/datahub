<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

$input = read_json_body();
$email = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');

if (!is_valid_email($email) || $password === '') {
    send_json(400, ['ok' => false, 'message' => 'Credenciais invalidas.']);
}

try {
    $stmt = $mysqli->prepare('SELECT id, name, email, password_hash, status FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user || $user['status'] !== 'active') {
        send_json(401, ['ok' => false, 'message' => 'Email ou senha incorretos.']);
    }

    if (!password_verify($password, $user['password_hash'])) {
        send_json(401, ['ok' => false, 'message' => 'Email ou senha incorretos.']);
    }

    $_SESSION['auth_user'] = [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email']
    ];

    send_json(200, [
        'ok' => true,
        'message' => 'Login realizado com sucesso.',
        'user' => $_SESSION['auth_user']
    ]);
} catch (Throwable $e) {
    send_json(500, ['ok' => false, 'message' => 'Falha ao autenticar.']);
}
