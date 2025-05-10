// frontend/src/services/symbolApi.js
export async function fetchSymbols() {
  const res = await fetch(`http://localhost:3000/api/symbols`);
  if (!res.ok) {
    throw new Error(`Failed to fetch symbols: ${res.status}`);
  }
  return res.json(); // verwacht array van strings, b.v. ['BTCUSDT', 'ETHUSDT', ...]
}
