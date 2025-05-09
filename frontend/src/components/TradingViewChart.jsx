// src/components/TradingViewChart.jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { subscribeCandles } from '../services/marketService';

export default function TradingViewChart({ symbol, timeframe }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.height = '400px';

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1F2937' /* Tailwind gray-800 */ },
        textColor: '#E5E7EB'    /* gray-200 */,
      },
      grid: {
        vertLines: { color: '#374151' /* gray-700 */ },
        horzLines: { color: '#374151' },
      },
      rightPriceScale: { borderColor: '#4B5563' /* gray-600 */ },
      timeScale:       { borderColor: '#4B5563' },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor:   '#10B981' /* green-500 */,
      downColor: '#EF4444' /* red-500 */,
      borderVisible: false,
      wickUpColor: '#D1FAE5',
      wickDownColor: '#FEE2E2',
    });

    // SSE data
    const unsubscribe = subscribeCandles(
      symbol, timeframe,
      data => candleSeries.setData(data),
      candle => candleSeries.update(candle)
    );

    // responsive
    const ro = new ResizeObserver(entries => {
      for (let e of entries) {
        chart.applyOptions({ width: e.contentRect.width });
      }
    });
    ro.observe(el);

    return () => {
      unsubscribe();
      ro.disconnect();
      chart.remove();
    };
  }, [symbol, timeframe]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
