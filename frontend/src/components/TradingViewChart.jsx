// frontend/src/components/TradingViewChart.jsx
import React, { useEffect, useRef } from 'react';

export default function TradingViewChart() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;

    new window.TradingView.widget({
      // Let op: hier container_id, en dat moet de ID van je div zijn
      container_id: containerRef.current.id,
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'Light',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      hide_side_toolbar: false,
      allow_symbol_change: true,
    });
  }, []);

  return (
    <div
      // Een vaste ID die je hierboven als container_id gebruikt
      id="tv_chart_container"
      ref={containerRef}
      style={{ width: '100%', height: '500px' }}
    />
  );
}
