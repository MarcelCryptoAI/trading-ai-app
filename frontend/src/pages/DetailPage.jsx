// frontend/src/pages/DetailPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import { subscribeCandles } from '../services/marketService';
import { fetchIndicatorDetails } from '../services/indicatorApi';
import IndicatorCard from '../components/IndicatorCard';

const TIMEFRAMES = [
  { label: '1H',  value: '60'  },
  { label: '5M',  value: '5'   },
  { label: '15M', value: '15'  },
  { label: '4H',  value: '240' },
  { label: '1D',  value: '1d'  },
];

const SORT_OPTIONS = [
  { label: 'IBS ↓',    value: 'ibs_desc' },
  { label: 'IBS ↑',    value: 'ibs_asc'  },
  { label: 'Naam A→Z', value: 'name_asc' },
];

export default function DetailPage() {
  const { symbol } = useParams();
  const [timeframe, setTimeframe] = useState('60');
  const [sortKey, setSortKey]     = useState('ibs_desc');
  const [indicators, setIndicators] = useState([]);
  const chartContainer = useRef(null);

  // 1) Chart initialiseren / updaten
  useEffect(() => {
    const el = chartContainer.current;
    if (!el) return;
    el.innerHTML = '';
    const chart = createChart(el, {
      layout: {
        background: { color: '#0F172A' },
        textColor:  '#CBD5E1',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      rightPriceScale: { borderColor: '#334155' },
      timeScale:       { borderColor: '#334155' },
    });
    const series = chart.addCandlestickSeries({
      upColor:       '#10B981',
      downColor:     '#EF4444',
      borderVisible: false,
      wickUpColor:   '#6EE7B7',
      wickDownColor: '#FCA5A5',
    });
    const unsub = subscribeCandles(
      symbol, timeframe,
      data   => series.setData(data),
      candle => series.update(candle),
    );
    const ro = new ResizeObserver(entries => {
      for (let e of entries) {
        chart.applyOptions({ width: e.contentRect.width });
      }
    });
    ro.observe(el);
    return () => {
      unsub();
      ro.disconnect();
      chart.remove();
    };
  }, [symbol, timeframe]);

  // 2) Indicator-data ophalen
  useEffect(() => {
    fetchIndicatorDetails(symbol, timeframe)
      .then(setIndicators)
      .catch(console.error);
  }, [symbol, timeframe]);

  // 3) Sorteren
  const sorted = [...indicators].sort((a, b) => {
    if (sortKey === 'ibs_desc') return b.ibs - a.ibs;
    if (sortKey === 'ibs_asc')  return a.ibs - b.ibs;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">

      {/* Header + Timeframes + Sort */}
      <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
        <h1 className="text-5xl font-extrabold text-cyan-400">
          Detailpagina voor {symbol}
        </h1>
        <div className="flex items-center space-x-6">
          <nav className="flex space-x-2 border-b border-gray-700 pb-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 font-medium ${
                  timeframe === tf.value
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </nav>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded-lg focus:outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Chart */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-gray-300">
          Live Chart
        </h2>
        <div
          ref={chartContainer}
          className="w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ height: 300, backgroundColor: '#0F172A' }}
        />
      </section>

      {/* Indicator Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sorted.map(ind => (
          <IndicatorCard
            key={ind.name}
            name={ind.name}
            params={ind.params}
            value={ind.value}
            advice={ind.advice}
            explanation={ind.explanation}
            ibs={ind.ibs}
          />
        ))}
      </section>

    </div>
  );
}
