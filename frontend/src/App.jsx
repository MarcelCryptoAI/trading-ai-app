// frontend/src/App.jsx
import React from 'react';
import TradingViewChart from './components/TradingViewChart';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Titel */}
      <h1 className="text-5xl font-bold text-center mb-8">
        Trading Dashboard
      </h1>

      {/* Chart */}
      <div className="mb-12">
        <TradingViewChart symbol="BTCUSDT" timeframe="60" />
      </div>

      {/* Indicatoren-Tabs */}
      <div className="max-w-6xl mx-auto">
        <Dashboard symbol="BTCUSDT" />
      </div>
    </div>
  );
}
