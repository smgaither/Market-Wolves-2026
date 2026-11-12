"""Fetch dividend-adjusted daily closes (total return) and write data.json."""
import json, datetime as dt, sys
import yfinance as yf

START = "2026-01-07"
TICKERS = ["IEF","GLD","DBMF","SMH","DRIV","AGG","VTEB","SHLD","NLR","AIQ","XBI","XAR","ARGT","ARKK","BETE","TQQQ"]

# auto_adjust=True -> Close is adjusted for splits AND dividends (total return)
df = yf.download(TICKERS, start=START, auto_adjust=True, progress=False, group_by="column")["Close"]
df = df.dropna(how="all")
if df.empty:
    sys.exit("No data returned")

out = {"updated": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
       "start": START, "dates": [d.strftime("%Y-%m-%d") for d in df.index], "series": {}}
missing = []
for t in TICKERS:
    s = df[t].ffill()
    first = s.first_valid_index()
    if first is None:
        missing.append(t); continue
    base = float(s.loc[first])
    out["series"][t] = [None if s.isna().iloc[i] else round(float(s.iloc[i]) / base - 1, 6) for i in range(len(s))]
if missing:
    sys.exit(f"Missing tickers: {missing}")
json.dump(out, open("data.json", "w"), separators=(",", ":"))
print("Wrote data.json through", out["dates"][-1])
