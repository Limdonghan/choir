import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReportForm from './pages/ReportForm';

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<ReportForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
