// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <Routes>
      {/* Home kan omleiden of je eigen dashboard zijn */}
      <Route path="/" element={<Navigate to="/detail/BTCUSDT" replace />} />

      {/* Detail-pagina voor elk symbool */}
      <Route path="/detail/:symbol" element={<DetailPage />} />

      {/* Fallback voor onbekende paden */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
}
