# Market Wolves 2026 – update speed

## Layer 1 (automatic, no setup): GitHub Action every 5 minutes
Runs every 5 min during US market hours, Mon-Fri (GitHub's minimum; runs can start a few minutes late).
Page re-reads data.json every 2 minutes. Typical lag: 5-15 minutes.

## Layer 2 (optional, ~5 min setup): Cloudflare Worker for ~1-minute data
1. Free account at dash.cloudflare.com -> Workers & Pages -> Create -> Worker -> name it `market-wolves`.
2. Edit code, paste all of worker.js, Deploy.
3. Copy the URL (https://market-wolves.<you>.workers.dev).
4. In index.html set: const LIVE_URL='https://market-wolves.<you>.workers.dev';  and commit.
The Worker caches 60s (free plan: 100k requests/day). Page refreshes every 60s. If the Worker ever fails, the page falls back to data.json automatically.

## Install as an app (PWA)
- iPhone (Safari): open the site -> Share -> Add to Home Screen.
- Android (Chrome): open the site -> menu -> Install app (or Add to Home screen).
- Desktop Chrome/Edge: click the install icon in the address bar.
The app always fetches fresh prices when online and shows the last loaded prices when offline (sw.js).
