#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$PWD"
echo "🚀 Starting indicator scaffolding..."

#####################################
# 1) BACKEND: Dependencies en files #
#####################################

echo "📦 Installing backend-deps (technicalindicators)..."
cd "$BASE_DIR/backend"
npm install technicalindicators

# 1a) services/indicatorService.js
echo "✍️  Creating services/indicatorService.js..."
mkdir -p src/services
cat > src/services/indicatorService.js << 'EOF'
/**
 * IndicatorService: berekent diverse technische indicatoren.
 * Je kunt hier uitbreiden naar alle 30 indicators.
 */
import { RSI } from 'technicalindicators';

export function computeRSI(dataCloses, period = 14) {
  return RSI.calculate({ values: dataCloses, period });
}

/**
 * TODO: Implementeer hier de andere 29 indicatoren, bijv:
 * - Stochastic
 * - CCI
 * - MACD
 * etc.
 */
EOF

# 1b) routes/indicators.js
echo "✍️  Creating routes/indicators.js..."
mkdir -p src/routes
cat > src/routes/indicators.js << 'EOF'
/**
 * Endpoint: GET /api/indicators/:symbol/:timeframe
 * Retourneert voor de laatste candle alle indicator-waarden en long/short signalen.
 */
import express from 'express';
import { getRecentCandles } from '../services/bybitService.js';
import { computeRSI } from '../services/indicatorService.js';

const router = express.Router();

router.get('/indicators/:symbol/:timeframe', async (req, res) => {
  const { symbol, timeframe } = req.params;
  const candles = await getRecentCandles(symbol, timeframe);
  const closes  = candles.map(c => c.close);

  // Voorbeeld: RSI(14)
  const rsiValues = computeRSI(closes, 14);
  const lastRsi   = rsiValues[rsiValues.length - 1] || null;
  const rsiSignal = lastRsi > 70 ? 'SHORT' : lastRsi < 30 ? 'LONG' : 'NEUTRAL';

  res.json({
    symbol,
    timeframe,
    lastRsi,
    rsiSignal,
    // TODO: voeg hier de andere indicator-waarden en signalen toe
  });
});

export default router;
EOF

# 1c) index.js importeren en gebruiken
echo "🔧 Updating src/index.js to mount /api/indicators..."
INDEX_FILE=src/index.js
if ! grep -q "routes/indicators.js" "$INDEX_FILE"; then
  sed -i '' "1s|^|import indicatorsRouter from './routes/indicators.js';\n|" "$INDEX_FILE"
  sed -i '' "/app.use('\/api', marketRouter);/a\\
app.use('/api', indicatorsRouter);
" "$INDEX_FILE"
fi

echo "✅ Backend scaffolding complete."

######################################
# 2) FRONTEND: Dependencies & files  #
######################################

echo "📦 Installing frontend-deps (@headlessui/react)..."
cd "$BASE_DIR/frontend"
npm install @headlessui/react

# 2a) services/indicatorService.js (frontend wrapper)
echo "✍️  Creating src/services/indicatorApi.js..."
mkdir -p src/services
cat > src/services/indicatorApi.js << 'EOF'
/**
 * Frontend service om indicator-waarden op te halen.
 */
export async function fetchIndicators(symbol, timeframe) {
  const res = await fetch(`/api/indicators/${symbol}/${timeframe}`);
  if (!res.ok) throw new Error('Failed to fetch indicators');
  return res.json();
}
EOF

# 2b) component IndicatorCard.jsx
echo "✍️  Creating src/components/IndicatorCard.jsx..."
mkdir -p src/components
cat > src/components/IndicatorCard.jsx << 'EOF'
import React from 'react';

export default function IndicatorCard({ name, value, signal, description }) {
  const color = signal === 'LONG' ? 'bg-green-600' :
                signal === 'SHORT' ? 'bg-red-600' : 'bg-gray-600';
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span className="text-xl font-bold text-blue-400">
          {value !== null ? Math.round(value) + '%' : '--'}
        </span>
      </div>
      <p className="text-sm text-gray-300 my-2 flex-1">{description}</p>
      <span className={\`mt-3 px-2 py-1 text-xs font-semibold rounded \${color} text-white\`}>
        {signal}
      </span>
    </div>
  );
}
EOF

# 2c) component IndicatorGrid.jsx
echo "✍️  Creating src/components/IndicatorGrid.jsx..."
cat > src/components/IndicatorGrid.jsx << 'EOF'
import React from 'react';
import IndicatorCard from './IndicatorCard';

export default function IndicatorGrid({ indicators }) {
  if (!indicators) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {indicators.map(ind => (
        <IndicatorCard
          key={ind.name}
          name={ind.name}
          value={ind.value}
          signal={ind.signal}
          description={ind.description}
        />
      ))}
    </div>
  );
}
EOF

# 2d) component Dashboard.jsx
echo "✍️  Creating src/components/Dashboard.jsx..."
cat > src/components/Dashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import IndicatorGrid from './IndicatorGrid';
import { fetchIndicators } from '../services/indicatorApi';

const timeframes = ['5', '15', '60', '240', '1d'];

export default function Dashboard({ symbol = 'BTCUSDT' }) {
  const [data, setData] = useState({});

  useEffect(() => {
    timeframes.forEach(tf => {
      fetchIndicators(symbol, tf).then(res => {
        // Voor demo verpak je alle indicatoren in een array
        setData(prev => ({
          ...prev,
          [tf]: [
            {
              name: 'RSI(14)',
              value: res.lastRsi,
              signal: res.rsiSignal,
              description: 'Relative Strength Index',
            },
            // TODO: push andere indicatoren uit res
          ],
        }));
      });
    });
  }, [symbol]);

  return (
    <Tab.Group>
      <Tab.List className="flex space-x-4 mb-4">
        {timeframes.map(tf => (
          <Tab key={tf} className="px-3 py-1 bg-gray-700 rounded text-white">
            {tf}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        {timeframes.map(tf => (
          <Tab.Panel key={tf}>
            <IndicatorGrid indicators={data[tf]} />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
EOF

# 2e) Update src/App.jsx
echo "🔧 Updating src/App.jsx to include Dashboard..."
APP_FILE=src/App.jsx
cat > "$APP_FILE" << 'EOF'
import React from 'react';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        Trading Dashboard
      </h1>
      <div className="w-full max-w-6xl">
        <Dashboard symbol="BTCUSDT" />
      </div>
    </div>
  );
}
EOF

echo "✅ Frontend scaffolding complete."

##################################
# 3) Instructies na setup-script #
##################################

cat << 'INFO'

🎉 Klaar!

➡️ Nu even handmatig:
   1. Commit & push je changes.
   2. Backend opnieuw starten:
       cd backend
       npm run dev
   3. Frontend opnieuw starten:
       cd frontend
       npm run dev

De Dashboard-tabbladen tonen nu alvast je RSI-kaart.
Voor de andere 29 indicatoren voeg je in
  • backend/src/services/indicatorService.js (compute-functies)
  • backend/src/routes/indicators.js (res.json uitbreiden)
  • frontend/src/components/Dashboard.jsx (map res naar kaarten)

Daarna kunnen we de styling oppoetsen aan je mockup! 💅

INFO
