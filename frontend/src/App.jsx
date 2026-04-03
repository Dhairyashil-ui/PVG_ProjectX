import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Profile from './components/Profile';
import Home from './components/Home';
import Navbar from './components/Navbar';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const savedUser = localStorage.getItem('trinetra_user');
    if (savedUser && (location.pathname === '/' || location.pathname === '/login')) {
      navigate('/home');
    }
  }, [navigate, location.pathname]);

  return (
    <>
      {(location.pathname !== '/' && location.pathname !== '/login') && <Navbar />}

      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login onLoginSuccess={(user) => {
            // Save global profile state to bypass on future loads
            localStorage.setItem('trinetra_user', JSON.stringify(user));
            navigate('/home');
        }} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
