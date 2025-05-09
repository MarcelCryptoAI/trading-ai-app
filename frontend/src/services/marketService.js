// frontend/src/services/marketService.js
export function subscribeCandles(symbol, timeframe, onInit, onCandle) {
  const url = `http://localhost:3000/api/data/${symbol}/${timeframe}`;
  const evt = new EventSource(url);

  evt.addEventListener('init', e => {
    onInit(JSON.parse(e.data));
  });

  evt.addEventListener('candle', e => {
    onCandle(JSON.parse(e.data));
  });

  return () => evt.close();
}
