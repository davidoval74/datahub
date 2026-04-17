<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

if (empty($_SESSION['auth_user'])) {
    send_json(401, ['ok' => false, 'message' => 'Nao autenticado.']);
}

send_json(200, [
    'ok' => true,
    'user' => $_SESSION['auth_user']
]);
