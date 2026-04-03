import { Routes, Route, useNavigate } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Profile from './components/Profile';
import Home from './components/Home';

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login onLoginSuccess={(user) => navigate('/profile', { state: { user } })} />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
