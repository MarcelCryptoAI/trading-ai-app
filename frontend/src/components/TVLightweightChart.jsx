import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function TVLightweightChart() {
  const chartContainer = useRef()

  useEffect(() => {
    const chart = createChart(chartContainer.current, {
      width: chartContainer.current.clientWidth,
      height: 400,
      layout: { background: { color: '#F9FAFB' }, textColor: '#333' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      rightPriceScale: { borderColor: '#ccc' },
      timeScale: { borderColor: '#ccc' },
    })

    const candleSeries = chart.addCandlestickSeries()
    // Dummy data; later zul je dit verversen met echte ByBit-candles
    candleSeries.setData([
      { time: '2023-05-09', open: 30000, high: 31000, low: 29500, close: 30500 },
      { time: '2023-05-10', open: 30500, high: 31500, low: 30000, close: 31000 },
      // …
    ])

    // Responsive
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    resizeObserver.observe(chartContainer.current)

    return () => resizeObserver.disconnect()
  }, [])

  return <div ref={chartContainer} className="w-full" />
}
