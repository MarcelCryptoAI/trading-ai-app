// frontend/src/components/TradingViewChart.jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { subscribeCandles } from '../services/marketService';

export default function TradingViewChart({
  symbol = 'BTCUSDT',
  timeframe = '60',
}) {
  const containerRef = useRef(null);
  const candleSeriesRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Zorg dat het container div height heeft
    container.style.height = '400px';

    // 1) Chart aanmaken
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 400,
      layout: {
        background: { color: '#F9FAFB' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      rightPriceScale: { borderColor: '#ccc' },
      timeScale: { borderColor: '#ccc' },
    });

    // 2) Candlestick-series toevoegen
    const candleSeries = chart.addCandlestickSeries();
    candleSeriesRef.current = candleSeries;

    // 3) Data subscriptie via SSE
    const unsubscribe = subscribeCandles(
      symbol,
      timeframe,
      // init callback: eerst de batch
      initialData => {
        candleSeries.setData(initialData);
      },
      // live update callback: iedere nieuwe candle
      newCandle => {
        candleSeries.update(newCandle);
      }
    );

    // 4) Responsiveness
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(container);

    // Cleanup bij unmount
    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [symbol, timeframe]);

  return <div ref={containerRef} className="w-full" />;
}
