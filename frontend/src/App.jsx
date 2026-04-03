import { Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
