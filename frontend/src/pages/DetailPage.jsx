// frontend/src/pages/DetailPage.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate }              from 'react-router-dom';
import { Combobox }                             from '@headlessui/react';
import { createChart }                          from 'lightweight-charts';

import { subscribeCandles }      from '../services/marketService';
import { fetchIndicatorDetails } from '../services/indicatorApi';
import { fetchAllSymbols }       from '../services/symbolService';
import Modal                     from '../components/Modal';
import IndicatorCard             from '../components/IndicatorCard';

/* ─────────────── 1. Constants ─────────────── */
const TIMEFRAMES = [
  { label: '5M',  value: '5'   },
  { label: '15M', value: '15'  },
  { label: '1H',  value: '60'  },
  { label: '4H',  value: '240' },
  { label: '1D',  value: '1d'  },
];
const SORT_OPTIONS = [
  { label: 'IBS ↓',    value: 'ibs_desc' },
  { label: 'IBS ↑',    value: 'ibs_asc'  },
  { label: 'Naam A→Z', value: 'name_asc' },
];
const CONF_THRESHOLD = 0.6; // 60%

/* ─────────────── 2. Main Component ─────────────── */
export default function DetailPage() {
  const { symbol } = useParams();
  const navigate   = useNavigate();

  /* ───────── 3. State Hooks ───────── */
  const [timeframe, setTimeframe]   = useState('60');
  const [sortKey, setSortKey]       = useState('ibs_desc');
  const [indicators, setIndicators] = useState([]);
  const [allSymbols, setAllSymbols] = useState([]);
  const [query, setQuery]           = useState(symbol);
  const [model, setModel]           = useState('gpt-4.1-mini-2025-04-14');
  const [tradeModal, setTradeModal] = useState(null);
  const [tradeParams, setTradeParams] = useState(null);

  const chartContainer = useRef(null);

  /* ───────── 4. Fetch All Symbols ───────── */
  useEffect(() => {
    fetchAllSymbols()
      .then(symbols => {
        setAllSymbols(symbols);
        setQuery(symbol);
      })
      .catch(err => console.error('Kon symbolen niet laden:', err));
  }, [symbol]);

  /* ───────── 5. Init & Update Chart ───────── */
  useEffect(() => {
    const el = chartContainer.current;
    if (!el) return;
    el.innerHTML = '';
    const chart = createChart(el, {
      layout: { background: { color: '#0F172A' }, textColor: '#CBD5E1' },
      grid:   { vertLines: { color: '#1E293B' }, horzLines: { color: '#1E293B' } },
      rightPriceScale: { borderColor: '#334155' },
      timeScale:       { borderColor: '#334155' },
    });
    const series = chart.addCandlestickSeries({
      upColor: '#10B981', downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#6EE7B7', wickDownColor: '#FCA5A5',
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
    return () => { unsub(); ro.disconnect(); chart.remove(); };
  }, [symbol, timeframe]);

  /* ───────── 6. Fetch Indicator Data ───────── */
  useEffect(() => {
    fetchIndicatorDetails(symbol, timeframe)
      .then(setIndicators)
      .catch(console.error);
  }, [symbol, timeframe]);

  /* ───────── 7. Filter Symbols ───────── */
  const filteredSymbols = useMemo(() => {
    if (!query) return allSymbols;
    return allSymbols.filter(s =>
      s.toLowerCase().includes(query.toLowerCase())
    );
  }, [allSymbols, query]);

  /* ───────── 8. Sort Indicators ───────── */
  const sortedIndicators = useMemo(() => {
    return [...indicators].sort((a, b) => {
      if (sortKey === 'ibs_desc') return b.ibs - a.ibs;
      if (sortKey === 'ibs_asc')  return a.ibs - b.ibs;
      return a.name.localeCompare(b.name);
    });
  }, [indicators, sortKey]);

  /* ───────── 9. Compute AI Advice ───────── */
  const adviceData = useMemo(() => {
    const active      = indicators.filter(i => i.ibs > 70);
    const longScore   = active.filter(i => /buy/i.test(i.advice)).reduce((s,i)=>s+i.ibs,0);
    const shortScore  = active.filter(i => /sell/i.test(i.advice)).reduce((s,i)=>s+i.ibs,0);
    const total       = longScore + shortScore;
    if (!total) return { available: false };
    const direction   = longScore >= shortScore ? 'Long' : 'Short';
    const confidence  = Math.round((Math.max(longScore, shortScore)/total)*100);
    const meetsThresh = confidence/100 >= CONF_THRESHOLD;
    return { available: true, direction, confidence, usedCount: active.length, meetsThreshold: meetsThresh };
  }, [indicators]);

  /* ───────── 10. Trade Button Handler ───────── */
  const onTradeClick = async level => {
    try {
      const res = await fetch('/api/chat/trade-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          direction: adviceData.direction,
          confidence: adviceData.confidence,
          riskLevel: level,
          model,
        }),
      });
      const params = await res.json();
      setTradeParams(params);
      setTradeModal(level);
    } catch {
      alert('Trade-advies niet beschikbaar');
    }
  };

  /* ───────── 11. Render ───────── */
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">

      {/* 11.1 Header + Controls */}
      <header className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="AI Crypto Analyzer" className="h-16" />
          <div>
            <h1 className="text-3xl font-display text-cyan-500">AI Crypto Analyzer</h1>
            <p className="text-gray-300 text-sm">
              Detail voor BYBIT Perp:  {symbol.replace('USDT',' / USDT')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">

          {/* Tijdframe-buttons */}
          <nav className="flex space-x-2 border-b border-gray-700 pb-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 rounded font-medium ${
                  timeframe === tf.value
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </nav>

          {/* Combobox voor zoekveld */}
          <Combobox value={symbol} onChange={val => navigate(`/detail/${val}`)}>
            <div className="relative">
              <Combobox.Input
                className="w-36 bg-gray-800 text-white px-3 py-1 rounded-lg"
                onChange={e => setQuery(e.target.value)}
                displayValue={val => val.replace('USDT',' / USDT')}
                placeholder="Zoek symbool..."
              />
              <Combobox.Options className="absolute mt-1 max-h-40 w-36 overflow-auto rounded bg-gray-800 shadow z-10">
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map(s => (
                    <Combobox.Option
                      key={s}
                      value={s}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-1 ${
                          active ? 'bg-cyan-600 text-white' : 'text-gray-200'
                        }`
                      }
                    >
                      {s.replace('USDT',' / USDT')}
                    </Combobox.Option>
                  ))
                ) : (
                  <div className="px-3 py-1 text-gray-500">Geen resultaat</div>
                )}
              </Combobox.Options>
            </div>
          </Combobox>

          {/* Sorteer-dropdown */}
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded-lg"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Model-switch */}
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded-lg"
          >
            <option value="gpt-4.1-mini-2025-04-14">GPT-4.1-mini</option>
            <option value="gpt-4.1-2025-04-14">GPT-4.1 (volwaardig)</option>
          </select>

        </div>
      </header>

      {/* 11.2 Live Chart */}
      <section
        className="perspective-1500 transform-gpu transition duration-500
                   hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
                   shadow-3d-lg bg-gray-800 rounded-2xl overflow-hidden"
        style={{ height: 300 }}
      >
        <div ref={chartContainer} className="w-full h-full" />
      </section>

      {/* 11.3 AI Advies */}
      <section
        className="perspective-1500 transform-gpu transition duration-500
                   hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
                   shadow-3d-lg bg-gray-800 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold text-cyan-400">AI Advies</h2>
        {adviceData.available ? (
          <>
            <p>
              <span className="font-semibold">{adviceData.direction}</span>{' '}
              <span className="ml-2 text-gray-300">({adviceData.confidence}%)</span>
            </p>
            <p className="text-gray-400 text-sm">
              Gebaseerd op {adviceData.usedCount} IBS&gt;70%
            </p>
            <div className="mt-4 bg-gray-700 rounded-lg p-4 text-sm text-gray-200">
              Waarom we voor een <strong>{adviceData.direction.toLowerCase()}</strong>-positie kiezen.
            </div>
            <div className="flex space-x-4 mt-4">
              {['Laag','Middel','Hoog'].map(level => (
                <button
                  key={level}
                  onClick={() => onTradeClick(level)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded font-medium"
                >
                  {level} risico
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="italic text-gray-300">Niet genoeg data of confidence te laag.</p>
            <div className="flex space-x-4 mt-4">
              {['Laag','Middel','Hoog'].map(level => (
                <button
                  key={level}
                  disabled
                  className="px-4 py-2 bg-cyan-500 opacity-40 cursor-not-allowed rounded"
                >
                  {level} risico
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 11.4 Trade Modal */}
      <Modal open={!!tradeModal} onClose={() => setTradeModal(null)}>
        <h2 className="text-xl font-bold mb-4">Tradeadvies ({tradeModal} risico)</h2>
        {tradeParams ? (
          <div className="space-y-2 text-sm">
            <p>Size: {tradeParams.sizePct}% van saldo</p>
            <p>Leverage: {tradeParams.leverage}× ({tradeParams.leverageType})</p>
            <p>Entries: {tradeParams.entries.join(', ')}</p>
            <p>Take Profits: {tradeParams.takeProfits.join(', ')}</p>
            <p>Stop Loss: {tradeParams.stopLoss}</p>
            <button
              className="mt-4 w-full bg-green-600 hover:bg-green-700 py-2 rounded"
              onClick={() => alert('🚀 Execute Trade!')}
            >
              Execute Trade
            </button>
          </div>
        ) : (
          <p>Laden advies…</p>
        )}
      </Modal>

      {/* 11.5 Indicator Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sortedIndicators.map(ind => (
          <div
            key={ind.name}
            className="perspective-1500 transform-gpu transition duration-500
                       hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
                       shadow-3d-md bg-gray-800 rounded-2xl"
          >
            <IndicatorCard {...ind} model={model} />
          </div>
        ))}
      </section>
    </div>
  );
}
