// frontend/src/services/marketService.js

// Zet hier je backend‐adres of zet in .env: VITE_BACKEND_URL=http://localhost:3000
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Subscribes to candle SSE-stream.
 * @param {string} symbol
 * @param {string} timeframe
 * @param {(data: Array) => void} onInit
 * @param {(candle: Object) => void} onCandle
 * @returns {() => void} unsubscribe function
 */
export function subscribeCandles(symbol, timeframe, onInit, onCandle) {
  const url = `${BASE_URL}/api/data/${symbol}/${timeframe}`;
  const evt = new EventSource(url);
  evt.addEventListener('init',   e => onInit(JSON.parse(e.data)));
  evt.addEventListener('candle', e => onCandle(JSON.parse(e.data)));
  return () => evt.close();
}
