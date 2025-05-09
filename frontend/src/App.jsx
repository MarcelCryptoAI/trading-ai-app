// frontend/src/App.jsx
// (Voorlopig gebruiken we een placeholder-div; later zetten we hier de TradingViewChart-component in)
export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        Trading Dashboard
      </h1>
      <div className="w-full max-w-4xl bg-white p-6 shadow-lg rounded-lg">
        <p className="text-gray-700 text-center">
          Hier komt straks de TradingView-chart
        </p>
      </div>
    </div>
  );
}
