<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

if (empty($_SESSION['auth_user'])) {
    send_json(401, ['ok' => false, 'message' => 'Nao autenticado.']);
}

try {
    $query = 'SELECT * FROM crypto_prices';
    $result = $mysqli->query($query);

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    send_json(200, [
        'ok' => true,
        'count' => count($rows),
        'data' => $rows
    ]);
} catch (Throwable $e) {
    send_json(500, ['ok' => false, 'message' => 'Falha ao consultar crypto_prices.']);
}
