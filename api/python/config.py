import mysql.connector


def set_conection():
    conn = mysql.connector.connect(
        host="69.6.249.158",
        user="daviho51_admin",
        password="RP47gXIjv}x!",
        database="daviho51_datahub",
        port=3306
    )

    return conn



