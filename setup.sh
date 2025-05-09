#!/usr/bin/env bash
set -euo pipefail

# root van je project
BASE_DIR="$HOME/Projects/trading-ai-app"
cd "$BASE_DIR"

echo "=== 1. Mappenstructuur checken"
mkdir -p frontend backend ai-service \
  backend/src/routes backend/src/services \
  ai-service/app

echo "=== 2. Frontend dependencies installeren"
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
# configs aanmaken als ze nog niet bestaan
if [ ! -f postcss.config.cjs ]; then
  cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOF
fi
if [ ! -f tailwind.config.cjs ]; then
  cat > tailwind.config.cjs << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
EOF
fi
cd ..

echo "=== 3. Backend dependencies installeren"
cd backend
npm install express jsonwebtoken passport passport-google-oauth20 passport-local bcryptjs cors
cd ..

echo "=== 4. SSE-route & ByBit-service scaffolden"
ROUTE_FILE="backend/src/routes/market.js"
BYBIT_FILE="backend/src/services/bybitService.js"
INDEX_FILE="backend/src/index.js"

# market route
cat > "$ROUTE_FILE" << 'EOF'
import express from 'express';
import { getRecentCandles, streamNewCandles } from '../services/bybitService.js';

const router = express.Router();

router.get('/data/:symbol/:timeframe', async (req, res) => {
  const { symbol, timeframe } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const recent = await getRecentCandles(symbol, timeframe);
  res.write(`event: init\ndata: ${JSON.stringify(recent)}\n\n`);
  const cleanup = streamNewCandles(symbol, timeframe, candle => {
    res.write(`event: candle\ndata: ${JSON.stringify(candle)}\n\n`);
  });
  req.on('close', () => { cleanup(); res.end(); });
});

export default router;
EOF

# bybitService placeholder
cat > "$BYBIT_FILE" << 'EOF'
/*
  TODO: implementeer hier:
  - getRecentCandles(symbol, timeframe): haal historische candles via REST
  - streamNewCandles(symbol, timeframe, callback): subscribe WebSocket en call callback(candle)
*/
export async function getRecentCandles(symbol, timeframe) {
  return []; // voorlopig lege array
}
export function streamNewCandles(symbol, timeframe, cb) {
  // TODO: WebSocket logic!
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}
EOF

# import en gebruik van route in index.js
if ! grep -q "market.js" "$INDEX_FILE"; then
  sed -i '' "1s|^|import marketRouter from './routes/market.js';\n|" "$INDEX_FILE"
  sed -i '' "/app.use(/i\\
app.use('/api', marketRouter);
" "$INDEX_FILE"
fi

cd "$BASE_DIR"
echo "=== Setup compleet! Run in frontend: npm run dev, in backend: npm run dev (of node src/index.js) ==="
