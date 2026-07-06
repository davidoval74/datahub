from pathlib import Path
import sys
import pandas as pd
import requests

BASE_DIR = Path(__file__).resolve().parents[2]
CSV_PATH = BASE_DIR / "bitcoin_prices.csv"

url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart"

# Recebe days como argumento de linha de comando, padrao 360
try:
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 360
except Exception:
    days = 360

params = {
    "vs_currency": "usd",
    "days": str(days)
}

response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

df = pd.DataFrame(data["prices"], columns=["timestamp", "price"])
df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
df.to_csv(CSV_PATH, index=False)

print(f"CSV atualizado em {CSV_PATH} (days={days})")