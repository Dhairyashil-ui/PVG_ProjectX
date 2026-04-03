import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import logoSrc from '../assets/logo.png';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Send token to backend
        console.log('Got Google token:', tokenResponse);
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        
        const data = await res.json();
        console.log('Backend response:', data);
        if (data.success) {
          // Typically we would save token and redirect
          alert('Login Successful! Welcome to Trinetra.');
        } else {
          alert('Backend validation failed.');
        }
      } catch (err) {
        console.error('Error during login:', err);
        alert('An error occurred. Check console.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.log('Login Failed:', error);
      alert('Login Failed');
    }
  });

  return (
    <div className="login-container">
      <div className="bg-glow animate-pulse-glow"></div>
      
      <div className="login-glass-card">
        <div className="logo-container">
          <img src={logoSrc} alt="Trinetra Logo" className="logo-image" />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h1 className="app-title">Trinetra</h1>
          <p className="app-subtitle">ADVANCED DETECTION ENGINE</p>
        </div>

        <button 
          onClick={() => login()} 
          className="auth-button"
          disabled={isLoading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="google-icon"
          />
          {isLoading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <p className="footer-text">
          Secure access required for authorized personnel only. 
          <br/>© 2026 Trinetra Systems.
        </p>
      </div>
    </div>
  );
}
