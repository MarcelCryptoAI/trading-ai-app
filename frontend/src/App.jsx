// frontend/src/App.jsx
import React from 'react';
import TradingViewChart from './components/TradingViewChart';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        Trading Dashboard
      </h1>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <TradingViewChart />
      </div>
    </div>
  );
}
