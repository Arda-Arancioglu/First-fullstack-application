import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingP from "./LandingPage/LandingP"; // Your existing login component
import RegisterP from "./RegisterPage/Register"; // The new registration component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LandingP />} />
        <Route path="/register" element={<RegisterP />} />
        {/* Optional: Redirect root path to login */}
        <Route path="/" element={<LandingP />} />
      </Routes>
    </Router>
  );
}

export default App;