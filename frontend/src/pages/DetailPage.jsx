import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate }              from 'react-router-dom';
import { Combobox }                             from '@headlessui/react';
import { createChart }                          from 'lightweight-charts';

import { subscribeCandles }    from '../services/marketService';
import { fetchIndicatorDetails } from '../services/indicatorApi';
import { fetchAllSymbols }     from '../services/symbolService';
import IndicatorCard           from '../components/IndicatorCard';

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

export default function DetailPage() {
  const { symbol } = useParams();
  const navigate   = useNavigate();

  const [timeframe, setTimeframe]   = useState('60');
  const [sortKey, setSortKey]       = useState('ibs_desc');
  const [indicators, setIndicators] = useState([]);
  const [allSymbols, setAllSymbols] = useState([]);
  const [query, setQuery]           = useState(symbol);

  const chartContainer = useRef(null);

  // 1) Haal alle symbols op
  useEffect(() => {
    fetchAllSymbols()
      .then(symbols => {
        setAllSymbols(symbols);
        setQuery(symbol);
      })
      .catch(err => console.error('Kon symbolen niet laden:', err));
  }, [symbol]);

  // 2) Chart init/update
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

  // 3) Haal indicators
  useEffect(() => {
    fetchIndicatorDetails(symbol, timeframe)
      .then(setIndicators)
      .catch(console.error);
  }, [symbol, timeframe]);

  // 4) Filter voor autocomplete
  const filteredSymbols = useMemo(() => {
    if (!query) return allSymbols;
    return allSymbols.filter(s =>
      s.toLowerCase().includes(query.toLowerCase())
    );
  }, [allSymbols, query]);

  // 5) Sorteer indicatoren
  const sorted = useMemo(() => {
    return [...indicators].sort((a, b) => {
      if (sortKey === 'ibs_desc') return b.ibs - a.ibs;
      if (sortKey === 'ibs_asc')  return a.ibs - b.ibs;
      return a.name.localeCompare(b.name);
    });
  }, [indicators, sortKey]);

  // 6) AI-advies
  const advice = useMemo(() => {
    const active = indicators.filter(i => i.ibs > 70);
    const longScore  = active.filter(i => /buy/i.test(i.advice)).reduce((s,i)=>s+i.ibs,0);
    const shortScore = active.filter(i => /sell/i.test(i.advice)).reduce((s,i)=>s+i.ibs,0);
    const total = longScore + shortScore;
    if (!total) return { available: false };
    const direction = longScore >= shortScore ? 'Long' : 'Short';
    const confidence = Math.round((Math.max(longScore, shortScore)/total)*100);
    return {
      available:      true,
      direction,
      confidence,
      usedCount:      active.length,
      meetsThreshold: confidence/100 >= CONF_THRESHOLD,
    };
  }, [indicators]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="AI Crypto Analyzer" className="h-12" />
          <div>
            <h1 className="text-3xl font-display text-cyan-400">AI Crypto Analyzer</h1>
            <p className="text-gray-300 text-sm">
              Detail voor {symbol.replace('USDT',' / USDT')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">

          {/* TF buttons */}
          <nav className="flex space-x-2 border-b border-gray-700 pb-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 rounded font-medium ${
                  timeframe===tf.value
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >{tf.label}</button>
            ))}
          </nav>

          {/* Combobox */}
          <Combobox value={symbol} onChange={val=>navigate(`/detail/${val}`)}>
            <div className="relative">
              <Combobox.Input
                className="w-32 bg-gray-800 text-white px-3 py-1 rounded"
                onChange={e=>setQuery(e.target.value)}
                displayValue={val=>val.replace('USDT',' / USDT')}
                placeholder="Symbool..."
              />
              <Combobox.Options className="absolute mt-1 max-h-40 w-32 overflow-auto bg-gray-800 rounded shadow-3d-md z-10">
                {filteredSymbols.length>0
                  ? filteredSymbols.map(s=>(
                      <Combobox.Option
                        key={s} value={s}
                        className={({active})=>
                          `px-3 py-1 cursor-pointer ${
                            active?'bg-cyan-600 text-white':'text-gray-200'
                          }`
                        }
                      >{s.replace('USDT',' / USDT')}</Combobox.Option>
                    ))
                  : <div className="px-3 py-1 text-gray-500">Geen resultaat</div>
                }
              </Combobox.Options>
            </div>
          </Combobox>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={e=>setSortKey(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded"
          >
            {SORT_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* LIVE CHART (3D tegel) */}
      <section
        className="
          perspective-1500 transform-gpu transition
          hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
          shadow-3d-lg bg-gray-800 rounded-2xl overflow-hidden
        "
        style={{ height: 300 }}
      >
        <div ref={chartContainer} className="w-full h-full" />
      </section>

      {/* AI Advies (3D tegel) */}
      <section
        className="
          perspective-1500 transform-gpu transition
          hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
          shadow-3d-lg bg-gray-800 rounded-2xl p-6 space-y-4
        "
      >
        <h2 className="text-2xl font-bold text-cyan-400">AI Advies</h2>
        {advice.available ? (
          <>
            <p>
              <span className="font-semibold">{advice.direction}</span>{' '}
              <span className="text-gray-300">({advice.confidence}%)</span>
            </p>
            <p className="text-gray-400 text-sm">
              Gebaseerd op {advice.usedCount} IBS&gt;70%
            </p>
            <div className="bg-gray-700 rounded p-4 text-sm text-gray-200">
              {/* GPT uitleg hier */}
              Waarom we voor een <strong>{advice.direction.toLowerCase()}</strong> positie kiezen.
            </div>
            <div className="flex space-x-4 mt-4">
              {['Laag','Middel','Hoog'].map(l=>(
                <button
                  key={l}
                  onClick={()=>alert(`Genereer ${l} risico trade`)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded"
                >{l} risico</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="italic text-gray-300">Niet genoeg data / confidence te laag.</p>
            <div className="flex space-x-4 mt-4">
              {['Laag','Middel','Hoog'].map(l=>(
                <button
                  key={l} disabled
                  className="px-4 py-2 bg-cyan-500 opacity-40 rounded cursor-not-allowed"
                >{l} risico</button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Indicator Cards (3D tegels) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sorted.map(ind=>(
          <div
            key={ind.name}
            className="
              perspective-1500 transform-gpu transition
              hover:rotate-y-3 hover:-rotate-x-2 hover:scale-105
              shadow-3d-md bg-gray-800 rounded-2xl
            "
          >
            <IndicatorCard {...ind} />
          </div>
        ))}
      </section>
    </div>
  );
}
