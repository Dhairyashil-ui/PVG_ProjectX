import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Home from './components/Home';
import Navbar from './components/Navbar';

function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== '/' && <Navbar />}

      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
