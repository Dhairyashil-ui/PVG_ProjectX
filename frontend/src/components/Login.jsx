import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import LottieModule from 'lottie-react';
const Lottie = typeof LottieModule === 'function' ? LottieModule : LottieModule?.default?.default || LottieModule?.default || LottieModule;
import emptyBoxData from '../../Empty Box.json';
import animationData from '../../data.json';

export default function Login({ onLoginSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 300); // 0.3s
        const t2 = setTimeout(() => setPhase(2), 800); // 0.8s
        const t3 = setTimeout(() => setPhase(3), 1600); // 1.6s
        const t4 = setTimeout(() => setPhase(4), 2200); // 2.2s
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError(null);
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (data.success) {
                    if (onLoginSuccess) {
                        onLoginSuccess(data.user);
                    }
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
        <div className="auth-root" style={{ zIndex: 10000 }}>
            {/* ── MAIN LAYOUT ── */}
            <div className="auth-layout">
                {/* LEFT — Lottie Animation */}
                <motion.div
                    className="auth-lottie-panel"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Lottie
                        animationData={animationData}
                        loop
                        autoplay
                        className="auth-lottie"
                        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                    />
                </motion.div>

                {/* RIGHT — Card Panel */}
                <div className="auth-card-panel" style={{ padding: '60px 200px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Animated bg blobs from original Trinetra design */}
                    <div className="login-bg-blob login-bg-blob-1" style={{ zIndex: 0 }} />
                    <div className="login-bg-blob login-bg-blob-2" style={{ zIndex: 0 }} />
                    <div className="login-bg-blob login-bg-blob-3" style={{ zIndex: 0 }} />

                    <motion.div
                        key="login"
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <motion.div
                            className="auth-welcome-heading"
                            initial={{ opacity: 0, y: -40, scale: 0.9 }}
                            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -40, scale: 0.9 }}
                            transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
                            style={{ marginBottom: '16px' }}
                        >
                            <span className="google-blue">Welcome</span>
                            {' '}to Trinetra
                        </motion.div>

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
                                className="auth-card"
                                initial={{ opacity: 0, scale: 0, y: 0 }}
                                animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0, y: 0 }}
                                transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
                                style={{ 
                                    position: 'relative', 
                                    zIndex: 10, 
                                    width: '100%', 
                                    visibility: phase >= 3 ? 'visible' : 'hidden',
                                    transformOrigin: 'center center'
                                }}
                            >
                                <div className="auth-card-accent" />
                                <div className="auth-card-header">
                                    <h1 className="auth-card-title">Sign in</h1>
                                    <p className="auth-card-subtitle">Sign in to your Trinetra workspace</p>
                                </div>
                                <div className="auth-card-divider" />
                                <div className="auth-oauth">
                                    <div className="auth-oauth-label">
                                        <Shield size={14} className="auth-shield-icon" strokeWidth={2.5} />
                                        <span>Your data is encrypted and secure</span>
                                    </div>
                                    <div className="auth-google-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => login()}
                                            disabled={isLoading}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                width: '100%',
                                                padding: '10px',
                                                background: '#ffffff',
                                                border: '1px solid #c8d0d8',
                                                borderRadius: '4px',
                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#3c4043',
                                                transition: 'all 0.2s ease',
                                                fontFamily: '"Roboto", "Inter", sans-serif',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.background = '#f8f9fa';
                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67,0.1)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.background = '#ffffff';
                                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
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
                                                        style={{ width: '18px', height: '18px' }}
                                                    />
                                                    <span>Continue with Google</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <motion.div
                                        className="auth-error"
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                                <p className="auth-card-footer">
                                    © 2026 Trinetra • Privacy • Terms
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
