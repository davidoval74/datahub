import config
import pandas as pd

conn = config.set_conection()
cursor = conn.cursor()

query = """
INSERT INTO crypto_prices (timestamp, price)
VALUES (%s, %s)
"""

df = pd.read_csv("bitcoin_prices.csv")

data_to_insert = [
    (row.timestamp, row.price)
    for row in df.itertuples(index=False)
]

cursor.executemany(query, data_to_insert)

conn.commit()

print(f"{cursor.rowcount} registros inseridos.")

cursor.close()
conn.close()