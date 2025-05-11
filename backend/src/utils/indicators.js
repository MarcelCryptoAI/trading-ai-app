/**
 * BASICS: elk compute… neemt een `candles` array ({ time, open, high, low, close, volume })
 * en eventueel parameters, en returned meestal een array van numbers of een object met meerdere arrays.
 */

/**
 * UTIL: simple moving average van een array (numbers)
 */
function smaArray(arr, period) {
  const res = []
  for (let i = period - 1; i < arr.length; i++) {
    const sum = arr.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0)
    res.push(sum / period)
  }
  return res
}

/**
 * UTIL: exponential moving average
 */
function emaArray(arr, period) {
  const k = 2 / (period + 1)
  const res = []
  let ema = arr.slice(0, period).reduce((s, v) => s + v, 0) / period
  res.push(ema)
  for (let i = period; i < arr.length; i++) {
    ema = arr[i] * k + ema * (1 - k)
    res.push(ema)
  }
  return res
}

/**
 * UTIL: weighted moving average
 */
function wmaArray(arr, period) {
  const res = []
  const denom = period * (period + 1) / 2
  for (let i = period - 1; i < arr.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += arr[i - j] * (period - j)
    }
    res.push(sum / denom)
  }
  return res
}

/**
 * ATR (Average True Range) helper, nodig voor Supertrend én Keltner
 */
function calculateATR(high, low, close, period) {
  const trs = []
  for (let i = 1; i < high.length; i++) {
    trs.push(
      Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      )
    )
  }
  return smaArray(trs, period)
}

// **1)** Relative Strength Index
export function computeRSI(candles, period = 14) {
  const closes = candles.map(c => c.close)
  const gains = [], losses = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(Math.max(diff, 0))
    losses.push(Math.max(-diff, 0))
  }
  const avgG = smaArray(gains, period)
  const avgL = smaArray(losses, period)
  const rs   = avgG.map((g, i) => g / (avgL[i] || 1))
  return rs.map(r => 100 - 100 / (1 + r))
}

// **2)** Stochastic %K/%D
export function computeStochastic(candles, kPeriod = 14, dPeriod = 3, dSmooth = 3) {
  const highs = candles.map(c => c.high)
  const lows  = candles.map(c => c.low)
  const closes= candles.map(c => c.close)
  const pctK = []
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highMax = Math.max(...highs.slice(i - (kPeriod - 1), i + 1))
    const lowMin  = Math.min(...lows.slice(i - (kPeriod - 1), i + 1))
    pctK.push(((closes[i] - lowMin) / (highMax - lowMin)) * 100)
  }
  const pctD    = smaArray(pctK, dPeriod)
  const smoothK = smaArray(pctK, dSmooth)
  return { pctK: smoothK, pctD }
}

// **3)** Commodity Channel Index
export function computeCCI(candles, period = 20) {
  const tp    = candles.map(c => (c.high + c.low + c.close) / 3)
  const smaTp = smaArray(tp, period)
  const mad   = tp.map((v, i) => {
    const slice = tp.slice(i - (period - 1), i + 1)
    const mean  = smaTp[i - (period - 1)]
    return slice.reduce((sum, x) => sum + Math.abs(x - mean), 0) / period
  })
  return tp.slice(period - 1).map((v, i) => (v - smaTp[i]) / (0.015 * mad[i]))
}

// **4)** Average Directional Index
export function computeADX(candles, period = 14) {
  const highs  = candles.map(c => c.high)
  const lows   = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const plusDM  = [], minusDM = [], tr = []
  for (let i = 1; i < highs.length; i++) {
    const upMove   = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM .push(upMove   > downMove && upMove   > 0 ? upMove   : 0)
    minusDM.push(downMove > upMove   && downMove > 0 ? downMove : 0)
    tr    .push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i]  - closes[i - 1]),
    ))
  }
  const smPlus  = smaArray(plusDM, period)
  const smMinus = smaArray(minusDM, period)
  const smTR    = smaArray(tr, period)
  const plusDI  = smPlus .map((v, i) => (v / smTR[i]) * 100)
  const minusDI = smMinus.map((v, i) => (v / smTR[i]) * 100)
  const dx      = plusDI .map((v, i) => Math.abs(v - minusDI[i])/(v + minusDI[i]) * 100)
  const adx     = smaArray(dx, period)
  return { plusDI, minusDI, adx }
}

// **5)** Awesome Oscillator
export function computeAwesomeOscillator(candles) {
  const median = candles.map(c => (c.high + c.low) / 2)
  const aoFast = smaArray(median, 5)
  const aoSlow = smaArray(median, 34)
  return aoFast.slice(aoFast.length - aoSlow.length)
                  .map((v, i) => v - aoSlow[i])
}

// **6)** Momentum
export function computeMomentum(candles, period = 10) {
  const closes = candles.map(c => c.close)
  return closes.map((v, i) => i >= period ? v - closes[i - period] : 0).slice(period)
}

// **7)** MACD
export function computeMACD(candles, fast = 12, slow = 26, signal = 9) {
  const closes  = candles.map(c => c.close)
  const emaFast = emaArray(closes, fast)
  const emaSlow = emaArray(closes, slow)
  const macd    = emaFast.slice(slow - 1).map((v, i) => v - emaSlow[i])
  const sigLine = emaArray(macd, signal)
  return { macd, signal: sigLine }
}

// **8)** Stochastic RSI
export function computeStochRSI(candles, rsiPeriod=14, k=3, d=3, smoothK=3) {
  const rsi  = computeRSI(candles, rsiPeriod)
  const sliceRsi = rsi.slice(rsiPeriod-1)
  const pctK = smaArray(
    sliceRsi.map((v, i, arr) =>
      (v - Math.min(...arr.slice(i-rsiPeriod+1, i+1))) /
      (Math.max(...arr.slice(i-rsiPeriod+1, i+1)) - Math.min(...arr.slice(i-rsiPeriod+1, i+1))) * 100
    ),
    k
  )
  const pctD = smaArray(pctK, d)
  return { pctK: pctK.slice(smoothK-1), pctD }
}

// **9)** Williams %R
export function computeWilliamsR(candles, period = 14) {
  const highs  = candles.map(c => c.high)
  const lows   = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const arr = []
  for (let i = period - 1; i < closes.length; i++) {
    const hh = Math.max(...highs.slice(i-period+1, i+1))
    const ll = Math.min(...lows .slice(i-period+1, i+1))
    arr.push(((hh - closes[i])/(hh - ll)) * -100 + 100 - 100)
  }
  return arr
}

// **10)** Bull Bear Power
export function computeBullBearPower(candles) {
  const ema13 = emaArray(candles.map(c => c.close), 13)
  return candles.slice(12)
                .map((c, i) => ((c.high + c.low + c.close)/3) - ema13[i])
}

// **11)** Ultimate Oscillator
export function computeUltimateOscillator(candles, p1=7, p2=14, p3=28) {
  const highs  = candles.map(c => c.high)
  const lows   = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const bp = closes.map((c, i) => c - Math.min(lows[i], closes[i-1]||c))
  const tr = closes.map((_, i) => Math.max(
    highs[i] - lows[i],
    Math.abs(highs[i] - (closes[i-1]||0)),
    Math.abs(lows[i]  - (closes[i-1]||0))
  ))
  const avg1 = smaArray(bp.map((v,i)=> v/tr[i]), p1)
  const avg2 = smaArray(bp.map((v,i)=> v/tr[i]), p2)
  const avg3 = smaArray(bp.map((v,i)=> v/tr[i]), p3)
  return avg3.map((_, i) => (4*avg1[i] + 2*avg2[i] + avg3[i]) / 7 * 100)
}

// **12)** EMA helper
export function computeEMA(candles, period) {
  return emaArray(candles.map(c => c.close), period)
         .map(v => ({ close: v }))
}

// **13)** SMA helper
export function computeSMA(candles, period) {
  return smaArray(
    candles.map(c => typeof c === 'object' ? c.close : c),
    period
  ).map(v => ({ close: v }))
}

// **14)** Ichimoku Base Line (Kijun-sen)
export function computeIchimokuBaseLine(candles) {
  const highs = candles.map(c => c.high)
  const lows  = candles.map(c => c.low)
  const period = 26
  const arr = []
  for (let i = period - 1; i < candles.length; i++) {
    arr.push((Math.max(...highs.slice(i-period+1, i+1)) +
              Math.min(...lows .slice(i-period+1, i+1))) / 2)
  }
  return arr
}

// **15)** Volume Weighted Moving Average
export function computeVWMA(candles, period) {
  const vws = []
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i-period+1, i+1)
    const num   = slice.reduce((sum, c) => sum + c.close * c.volume, 0)
    const den   = slice.reduce((sum, c) => sum + c.volume, 0)
    vws.push({ close: num/den })
  }
  return vws
}

// **16)** Hull Moving Average
export function computeHMA(candles, period) {
  const half  = period / 2, sqrtP = Math.round(Math.sqrt(period))
  const wma1  = wmaArray(candles.map(c=>c.close), half)
  const wma2  = wmaArray(candles.map(c=>c.close), period)
  const diff  = wma1.map((v,i)=> 2*v - (wma2[i]||0))
  return wmaArray(diff, sqrtP).map(v=> ({ close: v }))
}

// **17)** Parabolic SAR
export function computeParabolicSAR(candles, afStep=0.02, afMax=0.2) {
  const highs = candles.map(c=>c.high), lows = candles.map(c=>c.low)
  let psar     = [], ep = highs[0], af = afStep
  let isUp     = true, currentSAR = lows[0], currentEP = ep, currentAF = af
  for (let i=1; i<highs.length; i++) {
    currentSAR = currentSAR + currentAF*(currentEP - currentSAR)
    if (isUp) {
      currentSAR = Math.min(currentSAR, lows[i-1], lows[i-2]||lows[i-1])
      if (highs[i] > currentEP) { currentEP = highs[i]; currentAF = Math.min(currentAF+afStep, afMax) }
      if (lows[i]  < currentSAR) { isUp = false; currentSAR = currentEP; currentEP = highs[i]; currentAF = afStep }
    } else {
      currentSAR = Math.max(currentSAR, highs[i-1], highs[i-2]||highs[i-1])
      if (lows[i]  < currentEP) { currentEP = lows[i];  currentAF = Math.min(currentAF+afStep, afMax) }
      if (highs[i] > currentSAR) { isUp = true;  currentSAR = currentEP; currentEP = lows[i]; currentAF = afStep }
    }
    psar.push(currentSAR)
  }
  return psar
}

// **18)** Donchian Channels
export function computeDonchian(candles, period = 20) {
  const highs = candles.map(c=>c.high), lows = candles.map(c=>c.low)
  const upper = [], lower = []
  for (let i = period - 1; i < highs.length; i++) {
    upper.push(Math.max(...highs.slice(i-period+1, i+1)))
    lower.push(Math.min(...lows .slice(i-period+1, i+1)))
  }
  return { upper, lower }
}

// **19)** Keltner Channels
export function computeKeltner(candles, period = 20, mult = 1.5) {
  const highs  = candles.map(c => c.high)
  const lows   = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const emaArr = emaArray(closes, period)
  const atr    = calculateATR(highs, lows, closes, period)
  const upper  = emaArr.map((v,i)=> v + mult * atr[i])
  const lower  = emaArr.map((v,i)=> v - mult * atr[i])
  return { upper, lower }
}

/**
 * IBS calculators
 */
// RSI-specific IBS
export function calculateRSI_IBS(candles, period=14) {
  return calculateGenericIBS(
    candles,
    computeRSI(candles, period).map(v => v < 30 ? 'Buy' : v > 70 ? 'Sell' : 'Neutral')
  )
}

// generic IBS: winrate percentage correct signals
export function calculateGenericIBS(candles, signals) {
  let correct = 0, total = 0
  for (let i = 1; i < signals.length && i < candles.length; i++) {
    const sig  = signals[i]
    const move = candles[i].close - candles[i-1].close
    if (sig === 'Buy'  && move > 0) correct++
    if (sig === 'Sell' && move < 0) correct++
    if (sig === 'Buy' || sig === 'Sell') total++
  }
  return total ? Math.round((correct/total)*100) : 0
}
