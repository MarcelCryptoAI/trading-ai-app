// frontend/src/services/symbolService.js

/**
 * Haalt alle perpetual‐futures symbolen op via je backend.
 */
export async function fetchAllSymbols() {
  const res = await fetch('http://localhost:3000/api/symbols');
  if (!res.ok) {
    throw new Error('Kon symbolen niet ophalen');
  }
  return res.json(); // verwachte vorm: Array<string>, bv. ['BTCUSDT','ETHUSDT',…]
}

