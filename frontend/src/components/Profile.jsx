import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Mic, Upload, CheckCircle, ArrowRight } from 'lucide-react';

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
      setTimeout(() => { if(mediaRecorder.state === 'recording') stopRecording(); }, 10000); // 10s auto stop
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

  return (
    <div className="auth-root">
      <div className="login-bg-blob login-bg-blob-1" style={{ zIndex: 0 }} />
      <div className="login-bg-blob login-bg-blob-2" style={{ zIndex: 0 }} />
      <div className="login-bg-blob login-bg-blob-3" style={{ zIndex: 0 }} />

      <motion.div 
        className="auth-card" 
        style={{ zIndex: 10, width: '100%', maxWidth: '500px', padding: '40px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-card-accent" />
        <div className="auth-card-header" style={{ marginBottom: '24px' }}>
          <h1 className="auth-card-title">Setup Profile</h1>
          <p className="auth-card-subtitle">Complete your identity for Trinetra</p>
        </div>

        <div className="profile-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#5f6368', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 1: Facial Identity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: image ? `url(${image}) center/cover` : '#f1f3f4',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
              border: '2px dashed #dadce0', overflow: 'hidden', transition: 'all 0.3s ease'
            }}>
              {!image && <Camera size={32} color="#9aa0a6" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', position: 'absolute' }} />
            </div>
            <span style={{ marginTop: '12px', color: '#1a73e8', fontWeight: '500', fontSize: '14px', pointerEvents: 'none' }}>
              {image ? 'Change Photo' : 'Upload Photo'}
            </span>
          </div>
        </div>

        <div className="profile-section" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#5f6368', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2: Voice Signature</h3>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <label style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
              padding: '16px', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: '1px solid #dadce0', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#dadce0'}
            >
              <Upload size={24} color={voice ? '#34a853' : '#1a73e8'} style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#3c4043' }}>{voice ? 'Uploaded' : 'Upload File'}</span>
              <input type="file" accept="audio/*" onChange={handleVoiceUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }} />
            </label>

            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '16px', background: isRecording ? '#fce8e6' : '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${isRecording ? '#ea4335' : '#dadce0'}`, transition: 'all 0.2s'
            }}
            onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic size={24} color={isRecording ? '#ea4335' : (voice ? '#34a853' : '#1a73e8')} style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: isRecording ? '#ea4335' : '#3c4043' }}>
                {isRecording ? 'Stop Rec...' : 'Record Voice'}
              </span>
            </div>
          </div>
          {voice && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '12px', color: '#34a853', textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle size={14} /> Voice sample registered.</motion.p>}
        </div>

        {error && <p style={{ color: '#ea4335', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (!image && !voice)}
          style={{
            width: '100%', padding: '12px', background: (isSubmitting || (!image && !voice)) ? '#f1f3f4' : '#1a73e8', color: (isSubmitting || (!image && !voice)) ? '#9aa0a6' : 'white', borderRadius: '4px', border: 'none', fontWeight: '500', fontSize: '15px', cursor: (isSubmitting || (!image && !voice)) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s', boxShadow: (!isSubmitting && image && voice) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
        }}>
          {isSubmitting ? 'Saving Profile...' : 'Complete Registration'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </motion.div>
    </div>
  );
}
