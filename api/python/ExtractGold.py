from pathlib import Path

import pandas as pd
import requests

BASE_DIR = Path(__file__).resolve().parents[2]
CSV_PATH = BASE_DIR / "gold_prices.csv"

# Fonte de ouro via CoinGecko (PAX Gold / PAXG).
url = "https://api.coingecko.com/api/v3/coins/pax-gold/market_chart"

params = {
    "vs_currency": "usd",
    "days": "30"
}

response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

df = pd.DataFrame(data["prices"], columns=["timestamp", "price"])

df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")

df.to_csv(CSV_PATH, index=False)

print(f"CSV atualizado em {CSV_PATH}")
