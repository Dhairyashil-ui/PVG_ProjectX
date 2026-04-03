import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Mic, Upload, CheckCircle, ArrowRight, SkipForward } from 'lucide-react';
import LottieModule from 'lottie-react';
const Lottie = typeof LottieModule === 'function' ? LottieModule : LottieModule?.default?.default || LottieModule?.default || LottieModule;
import animationData from '../../data.json';

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || { name: 'User', email: 'example@trinetra.com', picture: '' };

  const [image, setImage] = useState(null);
  const [voice, setVoice] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVoice(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setVoice(reader.result);
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => { if (mediaRecorder.state === 'recording') stopRecording(); }, 10000); // 10s auto stop
    } catch (err) {
      setError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const updateLocalUserStorage = () => {
    try {
      const saved = localStorage.getItem('trinetra_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.isProfileComplete = true;
        localStorage.setItem('trinetra_user', JSON.stringify(parsed));
      }
    } catch(e) {}
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          picture: user.picture,
          userImage: image,
          voiceSample: voice
        })
      });

      const data = await res.json();
      if (data.success) {
        updateLocalUserStorage();
        navigate('/home');
      } else {
        setError(data.message || 'Failed to save profile');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Intentionally persisting the skip configuration down to MongoDB
      await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          picture: user.picture,
          skippedProfile: true
        })
      });
      updateLocalUserStorage();
      navigate('/home');
    } catch (err) {
      updateLocalUserStorage();
      navigate('/home');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="login-bg-blob login-bg-blob-1" style={{ zIndex: 0 }} />
          <div className="login-bg-blob login-bg-blob-2" style={{ zIndex: 0 }} />
          <div className="login-bg-blob login-bg-blob-3" style={{ zIndex: 0 }} />

          <motion.div
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
            initial={{ opacity: 0, scale: 0.2, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          >
            <div style={{ width: '100%', maxWidth: '420px' }}>
              <div className="auth-card" style={{ width: '100%' }}>
                <div className="auth-card-accent" />
                <div className="auth-card-header" style={{ marginBottom: '24px' }}>
                  <h1 className="auth-card-title">Identity Verification</h1>
                  <p className="auth-card-subtitle">Complete your profile to secure your workspace</p>
                </div>

                <div className="profile-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#5f6368', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 1: Facial Identity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '50%',
                      background: image ? `url(${image}) center/cover` : '#f1f3f4',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
                      border: '2px dashed #dadce0', overflow: 'hidden', transition: 'all 0.3s ease', position: 'relative'
                    }}>
                      {!image && <Camera size={28} color="#9aa0a6" />}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', position: 'absolute' }} />
                    </div>
                    <span style={{ marginTop: '12px', color: '#1a73e8', fontWeight: '500', fontSize: '13px', pointerEvents: 'none' }}>
                      {image ? 'Change Photo' : 'Upload Photo'}
                    </span>
                  </div>
                </div>

                <div className="profile-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#5f6368', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2: Voice Signature</h3>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <label style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '12px', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: '1px solid #dadce0', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                    }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#dadce0'}
                    >
                      <Upload size={20} color={voice ? '#34a853' : '#1a73e8'} style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#3c4043' }}>{voice ? 'Uploaded' : 'Upload voice'}</span>
                      <input type="file" accept="audio/*" onChange={handleVoiceUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }} />
                    </label>

                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '12px', background: isRecording ? '#fce8e6' : '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${isRecording ? '#ea4335' : '#dadce0'}`, transition: 'all 0.2s'
                    }}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      <Mic size={20} color={isRecording ? '#ea4335' : (voice ? '#34a853' : '#1a73e8')} style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: isRecording ? '#ea4335' : '#3c4043' }}>
                        {isRecording ? 'Stop Rec...' : 'Record Voice'}
                      </span>
                    </div>
                  </div>
                  {voice && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '12px', color: '#34a853', textAlign: 'center', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle size={14} /> Registered</motion.p>}
                </div>

                {error && <p style={{ color: '#ea4335', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!image && !voice)}
                    style={{
                      width: '100%', padding: '12px', background: (isSubmitting || (!image && !voice)) ? '#f1f3f4' : '#1a73e8', color: (isSubmitting || (!image && !voice)) ? '#9aa0a6' : 'white', borderRadius: '4px', border: 'none', fontWeight: '500', fontSize: '14px', cursor: (isSubmitting || (!image && !voice)) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s', boxShadow: (!isSubmitting && image && voice) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (!isSubmitting && (image || voice)) {
                        e.currentTarget.style.background = '#1557b0';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSubmitting && (image || voice)) {
                        e.currentTarget.style.background = '#1a73e8';
                      }
                    }}
                  >
                    {isSubmitting ? 'Saving Profile...' : 'Complete Verification'}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>

                  <button
                    onClick={handleSkip}
                    style={{
                      width: '100%', padding: '10px', background: 'transparent', color: '#5f6368', borderRadius: '4px', border: '1px solid #dadce0', fontWeight: '500', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#3c4043'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5f6368'; }}
                  >
                    Skip for now
                    <SkipForward size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
