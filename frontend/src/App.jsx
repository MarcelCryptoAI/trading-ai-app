import { Routes, Route } from 'react-router-dom';
import DetailPage from './pages/DetailPage';

function App() {
  return (
    <Routes>
      <Route path="/detail/:symbol" element={<DetailPage />} />
    </Routes>
  );
}

export default App;
