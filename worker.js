// Cloudflare Worker (free tier): returns the same JSON shape as data.json, computed live from Yahoo.
const START = 1767744000; // 2026-01-07 00:00 UTC
const TICKERS = ["IEF","GLD","DBMF","SMH","DRIV","AGG","VTEB","SHLD","NLR","AIQ","XBI","XAR","ARGT","ARKK","BETE","TQQQ"];
const CORS = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};

async function one(t) {
  const now = Math.floor(Date.now()/1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t}?period1=${START}&period2=${now}&interval=1d&includeAdjustedClose=true`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(t + " HTTP " + r.status);
  const j = await r.json();
  const res = j.chart.result[0];
  const adj = res.indicators.adjclose?.[0]?.adjclose || [];
  const cls = res.indicators.quote[0].close;
  const map = {};
  res.timestamp.forEach((ts, i) => {
    const p = adj[i] ?? cls[i];
    if (p != null) map[new Date(ts*1000).toISOString().slice(0,10)] = p;
  });
  return map;
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const cache = caches.default, key = new Request(new URL(req.url).origin + "/cached");
    const hit = await cache.match(key);
    if (hit) return hit;
    try {
      const maps = await Promise.all(TICKERS.map(one));
      const dates = [...new Set(maps.flatMap(m => Object.keys(m)))].sort();
      const series = {};
      TICKERS.forEach((t, k) => {
        let base = null, last = null;
        series[t] = dates.map(d => {
          if (maps[k][d] != null) last = maps[k][d];
          if (last == null) return null;
          if (base == null) base = last;
          return Math.round((last/base - 1)*1e6)/1e6;
        });
      });
      const resp = new Response(JSON.stringify({ updated: new Date().toISOString(), start: "2026-01-07", dates, series }),
        { headers: { ...CORS, "Cache-Control": "public, max-age=60" } });
      ctx.waitUntil(cache.put(key, resp.clone()));
      return resp;
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: CORS });
    }
  }
};
