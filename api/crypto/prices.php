<?php
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(405, ['ok' => false, 'message' => 'Metodo nao permitido.']);
}

if (empty($_SESSION['auth_user'])) {
    send_json(401, ['ok' => false, 'message' => 'Nao autenticado.']);
}

function run_python_script($pythonBinary, $scriptPath, $workingDirectory) {
    if (!function_exists('exec')) {
        throw new RuntimeException('A funcao exec nao esta habilitada no servidor PHP.');
    }

    if (!is_dir($workingDirectory)) {
        throw new RuntimeException('Diretorio de execucao Python nao encontrado.');
    }

    if (!is_file($scriptPath)) {
        throw new RuntimeException('Script Python nao encontrado: ' . basename($scriptPath));
    }

    $originalDirectory = getcwd();
    $output = [];
    $exitCode = 0;

    chdir($workingDirectory);
    exec(escapeshellarg($pythonBinary) . ' ' . escapeshellarg($scriptPath) . ' 2>&1', $output, $exitCode);
    if ($originalDirectory !== false) {
        chdir($originalDirectory);
    }

    if ($exitCode !== 0) {
        $message = trim(implode("\n", $output));
        throw new RuntimeException($message !== '' ? $message : 'Falha ao executar script Python.');
    }

    return trim(implode("\n", $output));
}

function load_crypto_prices_from_csv_with_php($mysqli, $csvPath) {
    if (!is_file($csvPath)) {
        throw new RuntimeException('CSV de bitcoin nao encontrado para carga no banco.');
    }

    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS crypto_prices (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            timestamp DATETIME NOT NULL,
            price DECIMAL(18, 8) NOT NULL,
            PRIMARY KEY (id),
            KEY idx_crypto_prices_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $mysqli->query('TRUNCATE TABLE crypto_prices');

    $stmt = $mysqli->prepare('INSERT INTO crypto_prices (timestamp, price) VALUES (?, ?)');
    if (!$stmt) {
        throw new RuntimeException('Falha ao preparar insert de crypto_prices.');
    }

    $handle = fopen($csvPath, 'r');
    if ($handle === false) {
        $stmt->close();
        throw new RuntimeException('Falha ao abrir CSV de bitcoin para leitura.');
    }

    $inserted = 0;
    $header = fgetcsv($handle);
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) < 2) {
            continue;
        }

        $timestamp = trim((string)$row[0]);
        $price = (float)$row[1];

        if ($timestamp === '') {
            continue;
        }

        $stmt->bind_param('sd', $timestamp, $price);
        $stmt->execute();
        $inserted++;
    }

    fclose($handle);
    $stmt->close();

    return 'Carga via PHP concluida com ' . $inserted . ' registros.';
}

try {
    $defaultPythonBinary = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
    $pythonBinary = $config['python_bin'] ?? $defaultPythonBinary;
    $pythonDirectory = realpath(__DIR__ . '/../python');
    $extractScript = $pythonDirectory . DIRECTORY_SEPARATOR . 'Extract.py';
    $loadScript = $pythonDirectory . DIRECTORY_SEPARATOR . 'Load.py';
    $csvPath = realpath(__DIR__ . '/../../bitcoin_prices.csv') ?: (__DIR__ . '/../../bitcoin_prices.csv');

    $extractOutput = run_python_script($pythonBinary, $extractScript, $pythonDirectory);
    try {
        $loadOutput = run_python_script($pythonBinary, $loadScript, $pythonDirectory);
    } catch (RuntimeException $loadException) {
        $loadErrorText = $loadException->getMessage();
        if (strpos($loadErrorText, "No module named 'mysql'") !== false || strpos($loadErrorText, 'No module named mysql') !== false) {
            $loadOutput = load_crypto_prices_from_csv_with_php($mysqli, $csvPath);
        } else {
            throw $loadException;
        }
    }

    $query = 'SELECT * FROM crypto_prices';
    $result = $mysqli->query($query);

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    send_json(200, [
        'ok' => true,
        'extractOutput' => $extractOutput,
        'loadOutput' => $loadOutput,
        'count' => count($rows),
        'data' => $rows
    ]);
} catch (Throwable $e) {
    send_json(500, ['ok' => false, 'message' => 'Falha ao atualizar/consultar crypto_prices.', 'details' => $e->getMessage()]);
}
