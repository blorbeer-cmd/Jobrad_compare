import { Routes, Route } from 'react-router-dom';
import { ComparePage } from './pages/ComparePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ComparePage />} />
    </Routes>
  );
}

export default App;
