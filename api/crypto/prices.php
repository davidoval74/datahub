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

try {
    $defaultPythonBinary = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
    $pythonBinary = $config['python_bin'] ?? $defaultPythonBinary;
    $pythonDirectory = realpath(__DIR__ . '/../python');
    $extractScript = $pythonDirectory . DIRECTORY_SEPARATOR . 'Extract.py';
    $loadScript = $pythonDirectory . DIRECTORY_SEPARATOR . 'Load.py';

    $extractOutput = run_python_script($pythonBinary, $extractScript, $pythonDirectory);
    $loadOutput = run_python_script($pythonBinary, $loadScript, $pythonDirectory);

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
