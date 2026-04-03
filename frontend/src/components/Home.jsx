import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Mic, Monitor, UploadCloud } from 'lucide-react';
import { useState } from 'react';

const options = [
  { id: 'image', label: 'Upload Image', icon: ImageIcon, color: '#4285F4', bg: '#e8f0fe' },
  { id: 'video', label: 'Upload Video', icon: Video, color: '#EA4335', bg: '#fce8e6' },
  { id: 'audio', label: 'Upload Audio', icon: Mic, color: '#FBBC05', bg: '#fef7e0' },
  { id: 'live', label: 'Live Screen', icon: Monitor, color: '#34A853', bg: '#e6f4ea' }
];

export default function Home() {
  const [activeUpload, setActiveUpload] = useState(null);

  return (
    <div className="auth-root" style={{ background: '#f8f9fa' }}>
      <div className="login-bg-blob login-bg-blob-1" style={{ zIndex: 0 }} />
      <div className="login-bg-blob login-bg-blob-2" style={{ zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '800px', padding: '40px', marginTop: '60px' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <h1 style={{ fontSize: '36px', color: '#202124', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Trinetra Workspace</h1>
          <p style={{ color: '#5f6368', fontSize: '16px', marginTop: '12px' }}>Select an input source to begin analysis</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {options.map((opt, i) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveUpload(opt.id)}
              style={{
                background: 'white', borderRadius: '16px', padding: '32px 24px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                boxShadow: activeUpload === opt.id ? `0 0 0 2px ${opt.color}, 0 12px 24px rgba(0,0,0,0.1)` : '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s', position: 'relative', overflow: 'hidden'
              }}
            >
              {activeUpload === opt.id && <motion.div layoutId="highlight" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: opt.color }} />}
              <div style={{ background: opt.bg, padding: '16px', borderRadius: '50%' }}>
                <opt.icon size={32} color={opt.color} />
              </div>
              <span style={{ fontWeight: '600', color: '#3c4043', fontSize: '15px' }}>{opt.label}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeUpload && (
            <motion.div
              key={activeUpload}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '2px dashed #dadce0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
            >
              <UploadCloud size={48} color="#9aa0a6" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', color: '#202124', marginBottom: '8px', textTransform: 'capitalize' }}>Upload your {activeUpload}</h3>
              <p style={{ color: '#5f6368', marginBottom: '24px', fontSize: '14px' }}>Drag and drop or browse your files to instantly process them.</p>
              <button style={{
                padding: '12px 28px', background: options.find(o => o.id === activeUpload)?.color || '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                Browse Files
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
