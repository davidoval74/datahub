import config
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
CSV_PATH = BASE_DIR / "gold_prices.csv"

conn = config.set_conection()
cursor = conn.cursor()

query = """
INSERT INTO gold_prices (timestamp, price)
VALUES (%s, %s)
"""

cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS gold_prices (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        timestamp DATETIME NOT NULL,
        price DECIMAL(18, 8) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_gold_prices_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
)

cursor.execute("TRUNCATE TABLE gold_prices")

df = pd.read_csv(CSV_PATH)

data_to_insert = [
    (row.timestamp, row.price)
    for row in df.itertuples(index=False)
]

cursor.executemany(query, data_to_insert)

conn.commit()

print(f"{cursor.rowcount} registros inseridos.")

cursor.close()
conn.close()
