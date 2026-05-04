# Copie este arquivo para config.py e defina as variaveis de ambiente listadas abaixo,
# ou preencha os valores padrao no os.environ.get() conforme seu ambiente.
#
# Variaveis de ambiente necessarias:
#   DB_HOST   - host do banco (ex: localhost ou IP do servidor)
#   DB_USER   - usuario do banco
#   DB_PASS   - senha do banco
#   DB_NAME   - nome do banco
#   DB_PORT   - porta (opcional, padrao: 3306)
#
# No cPanel, defina essas variaveis em:
#   Software > Setup Python App > Environment variables
#   ou configure no .htaccess / painel de variaveis de ambiente.

import os
import mysql.connector


def set_conection():
    host = os.environ.get("DB_HOST")
    user = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASS")
    database = os.environ.get("DB_NAME")
    port = int(os.environ.get("DB_PORT", 3306))

    missing = [k for k, v in {"DB_HOST": host, "DB_USER": user, "DB_PASS": password, "DB_NAME": database}.items() if not v]
    if missing:
        raise EnvironmentError(f"Variaveis de ambiente ausentes: {', '.join(missing)}")

    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port
    )

    return conn
