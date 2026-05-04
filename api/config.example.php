<?php
/*
 * Copie este arquivo para config.php e preencha com os dados do MySQL no cPanel.
 * Exemplo comum no cPanel:
 * - host: localhost
 * - database: usuario_cpanel_nomebd
 * - username: usuario_cpanel_userdb
 * - password: senha_forte
 */

return [
    'db_host' => 'localhost',
    'db_name' => 'cpanel_database_name',
    'db_user' => 'cpanel_database_user',
    'db_pass' => 'cpanel_database_password',
    'db_port' => 3306,
    'session_name' => 'datahub_session',
    'recaptcha_secret' => 'your_recaptcha_v2_secret_key_here'
];
