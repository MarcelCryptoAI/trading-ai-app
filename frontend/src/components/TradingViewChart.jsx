// frontend/src/components/TradingViewChart.jsx
import React, { useEffect, useRef } from 'react';
import { widget } from 'tradingview-charting-library';

export default function TradingViewChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    new widget({
      container_id: chartRef.current,
      autosize: true,
      symbol: 'BTCUSDT',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'Light',
      style: '1',
      locale: 'en',
      library_path: '/node_modules/tradingview-charting-library/',
    });
  }, []);

  return (
    <div
      id={chartRef.current} 
      ref={chartRef}
      style={{ width: '100%', height: '500px' }}
    />
  );
}
