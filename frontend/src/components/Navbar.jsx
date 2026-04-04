import { Bell, User, Monitor, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('trinetra_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('trinetra_user');
    navigate('/');
  };

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, padding: '16px 40px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 10000, borderBottom: '1px solid rgba(0,0,0,0.06)',
      backgroundColor: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/home')}>
        <img src={logo} alt="Trinetra Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#202124', letterSpacing: '-0.5px' }}>Trinetra</span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ cursor: 'pointer', position: 'relative' }}>
            <Bell size={24} color="#5f6368" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ea4335', borderRadius: '50%', border: '2px solid white' }}></span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 6px', background: 'white', border: '1px solid #dadce0', borderRadius: '30px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            {user.picture ? (
              <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <User size={18} color="#1a73e8" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#3c4043', lineHeight: '1.2' }}>{user.name || 'My Account'}</span>
            </div>
            <motion.div
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              whileHover={{ color: '#ea4335' }}
              style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', color: '#9aa0a6' }}
              title="Logout"
            >
              <LogOut size={16} />
            </motion.div>
          </motion.div>
        </div>
      )}
    </header>
  );
}
