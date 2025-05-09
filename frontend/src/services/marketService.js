// frontend/src/services/marketService.js
export function subscribeCandles(symbol, timeframe, onInit, onCandle) {
  const evt = new EventSource(`/api/data/${symbol}/${timeframe}`);
  evt.addEventListener('init',  e => onInit(JSON.parse(e.data)));
  evt.addEventListener('candle', e => onCandle(JSON.parse(e.data)));
  return () => evt.close();
}
