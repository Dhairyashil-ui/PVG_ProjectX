import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import LottieModule from 'lottie-react';
const Lottie = typeof LottieModule === 'function' ? LottieModule : LottieModule?.default?.default || LottieModule?.default || LottieModule;
import logoSrc from '../assets/logo.png';
import emptyBoxData from '../../Empty Box.json';

export default function Login({ onLoginSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 1000); // 1s
        const t2 = setTimeout(() => setPhase(2), 2000); // 2s: Box slides up
        const t3 = setTimeout(() => setPhase(3), 4000); // 4s: Card scales up from box
        const t4 = setTimeout(() => setPhase(4), 5000); // 5s: Box rolls out to the left
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch('http://localhost:5000/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (data.success) {
                    alert('Login Successful! Welcome to Trinetra.');
                } else {
                    setError('Backend validation failed. Please try again.');
                }
            } catch (err) {
                console.error('Error during login:', err);
                setError('Unable to connect to server. Check console for details.');
            } finally {
                setIsLoading(false);
            }
        },
        onError: (err) => {
            console.error('Google login failed:', err);
            setError('Google authentication failed. Please try again.');
        },
    });

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <motion.div
                key="login"
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <AnimatePresence>
                        {phase >= 2 && phase < 4 && (
                            <motion.div
                                initial={{ opacity: 0, y: 150, x: 0, rotate: 0 }}
                                animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                                exit={{ 
                                    x: '60vw', 
                                    y: '60vh',
                                    rotate: 720, 
                                    opacity: 1,
                                    transition: { duration: 2.5, ease: 'easeIn' }
                                }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    position: 'absolute',
                                    width: '320px',
                                    height: '320px',
                                    zIndex: 1,
                                    pointerEvents: 'none'
                                }}
                            >
                                <Lottie
                                    animationData={emptyBoxData}
                                    loop={false}
                                    autoplay
                                    rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                        transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
                        style={{ 
                            position: 'relative', 
                            zIndex: 10, 
                            width: '100%', 
                            maxWidth: '420px',
                            visibility: phase >= 3 ? 'visible' : 'hidden',
                            background: '#ffffff',
                            border: '1px solid rgba(228, 232, 240, 0.9)',
                            borderRadius: '20px',
                            padding: '44px 40px 36px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)'
                        }}
                    >
                        <img src={logoSrc} alt="Trinetra Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '32px' }} />
                        
                        {error && (
                            <div style={{ color: '#dc2626', fontSize: '13px', background: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '20px', width: '100%', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => login()}
                                disabled={isLoading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    padding: '12px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd1e0',
                                    borderRadius: '8px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.background = '#f8f9fc';
                                        e.currentTarget.style.borderColor = '#94a3b8';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.borderColor = '#cbd1e0';
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <span>Authenticating...</span>
                                ) : (
                                    <>
                                        <img
                                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                            alt="Google"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
