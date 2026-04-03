import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

// Since this is a template, we use a placeholder Client ID if one is not provided.
// In a real app, this should come from import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1044465224388-72r28oabeq3t3ocigb818edj122g6j2n.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
