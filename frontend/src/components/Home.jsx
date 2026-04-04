import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, Video, Mic, FileText,
  UploadCloud, ShieldAlert, Fingerprint, AlertTriangle,
  Info, Loader2, History, CheckCircle2, XCircle, HelpCircle,
  ChevronLeft, ChevronRight, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.jpeg';
import { useDetection } from '../hooks/useDetection';

/* ─── Media type options ─────────────────────────── */
const options = [
  { id: 'image', label: 'Image', icon: ImageIcon, color: '#4285F4', bg: '#e8f0fe', accepts: 'image/*', hint: 'Supports JPG, PNG, WEBP' },
  { id: 'audio', label: 'Audio', icon: Mic, color: '#FBBC05', bg: '#fef7e0', accepts: 'audio/*', hint: 'Supports MP3, WAV, M4A' },
  { id: 'video', label: 'Video', icon: Video, color: '#EA4335', bg: '#fce8e6', accepts: 'video/*', hint: 'Supports MP4, MOV, AVI (max 50MB)' },
  { id: 'text', label: 'Text', icon: FileText, color: '#34A853', bg: '#e6f4ea', accepts: 'text/plain', hint: 'Paste or upload text (min 20 chars)' },
];

/* ─── Helper: format bytes ───────────────────────── */
const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/* ─── Helper: format date ────────────────────────── */
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ─── Risk color helper ──────────────────────────── */
const getRiskProfile = (aiProbability) => {
  if (aiProbability == null) return { label: 'UNKNOWN', color: '#9aa0a6', bg: '#f1f3f4', textColor: '#5f6368' };
  const pct = aiProbability * 100;
  if (pct >= 75) return { label: 'CRITICAL', color: '#EA4335', bg: '#fce8e6', textColor: '#d93025' };
  if (pct >= 50) return { label: 'HIGH', color: '#FA7B17', bg: '#fef0e6', textColor: '#d56e15' };
  if (pct >= 25) return { label: 'MODERATE', color: '#FBBC05', bg: '#fef7e0', textColor: '#c5960a' };
  return { label: 'LOW', color: '#34A853', bg: '#e6f4ea', textColor: '#137333' };
};

/* ─── Result Type Badge ──────────────────────────── */
const ResultBadge = ({ resultType }) => {
  const map = {
    ai: { label: 'AI GENERATED', icon: XCircle, color: '#EA4335', bg: '#fce8e6' },
    human: { label: 'HUMAN / REAL', icon: CheckCircle2, color: '#34A853', bg: '#e6f4ea' },
    uncertain: { label: 'UNCERTAIN', icon: HelpCircle, color: '#FBBC05', bg: '#fef7e0' },
  };
  const cfg = map[resultType] || map.uncertain;
  const Icon = cfg.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: cfg.bg, color: cfg.color, padding: '8px 18px', borderRadius: '50px', fontWeight: '800', fontSize: '13px', letterSpacing: '1px' }}>
      <Icon size={16} />
      {cfg.label}
    </div>
  );
};

/* ─── Upload Progress Bar ────────────────────────── */
const ProgressBar = ({ progress, color }) => (
  <div style={{ width: '100%', background: '#e8eaed', borderRadius: '50px', overflow: 'hidden', height: '6px' }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ ease: 'easeOut', duration: 0.3 }}
      style={{ height: '100%', background: color, borderRadius: '50px' }}
    />
  </div>
);

/* ─── Scan History Row ───────────────────────────── */
const HistoryRow = ({ scan }) => {
  const opt = options.find(o => o.id === scan.mediaType) || options[0];
  const risk = getRiskProfile(scan.aiProbability);
  const Icon = opt.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '14px', background: '#fff', border: '1px solid #e8eaed', transition: 'box-shadow 0.2s' }}
      whileHover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
    >
      <div style={{ background: opt.bg, padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
        <Icon size={20} color={opt.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#202124', white: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scan.originalFilename || 'Text Input'}
        </div>
        <div style={{ fontSize: '12px', color: '#80868b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <Clock size={11} />
          {formatDate(scan.createdAt)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {scan.status === 'completed' ? (
          <>
            <div style={{ fontSize: '20px', fontWeight: '900', color: risk.textColor }}>{Math.round((scan.aiProbability ?? 0) * 100)}%</div>
            <div style={{ fontSize: '11px', color: risk.color, fontWeight: '700', background: risk.bg, padding: '2px 8px', borderRadius: '20px', marginTop: '4px' }}>{risk.label}</div>
          </>
        ) : (
          <div style={{ fontSize: '12px', color: '#9aa0a6', background: '#f1f3f4', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', textTransform: 'uppercase' }}>
            {scan.status}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN HOME COMPONENT
═══════════════════════════════════════════════════ */
export default function Home() {
  const userRaw = localStorage.getItem('trinetra_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userEmail = user?.email || null;

  const [activeUpload, setActiveUpload] = useState(null);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history'
  const [historyPage, setHistoryPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const {
    status, uploadProgress, result, error,
    history, historyPagination, historyLoading,
    runFileScan, runTextScan, loadHistory, reset,
  } = useDetection(userEmail);

  const isProcessing = status === 'uploading' || status === 'analyzing';
  const isDone = status === 'done';
  const hasError = status === 'error';

  const activeOpt = options.find(o => o.id === activeUpload);

  /* ── Load history when tab switches ── */
  useEffect(() => {
    if (activeTab === 'history' && userEmail) {
      loadHistory(historyPage);
    }
  }, [activeTab, historyPage, userEmail, loadHistory]);

  /* ── File submit ── */
  const handleFileSubmit = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    reset();
    runFileScan(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFileSubmit(e.target.files[0]);
  };

  /* ── Drag & Drop ── */
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSubmit(dropped);
  };

  /* ── Option click ── */
  const handleOptionClick = (id) => {
    if (activeUpload === id) {
      setActiveUpload(null);
      setFile(null);
      setTextInput('');
      reset();
    } else {
      setActiveUpload(id);
      setFile(null);
      setTextInput('');
      reset();
    }
  };

  /* ── Scan new ── */
  const handleScanNew = () => {
    setActiveUpload(null);
    setFile(null);
    setTextInput('');
    reset();
  };

  /* ── Result derived data ── */
  const scanResult = result?.result || null;
  const aiPct = scanResult?.ai_probability != null ? Math.round(scanResult.ai_probability * 100) : null;
  const humanPct = scanResult?.human_probability != null ? Math.round(scanResult.human_probability * 100) : null;
  const trustScore = humanPct != null ? humanPct : null;
  const risk = getRiskProfile(scanResult?.ai_probability);

  return (
    <div
      className="auth-root"
      style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflowY: 'auto' }}
    >
      {/* Background blobs */}
      <div className="login-bg-blob login-bg-blob-1" style={{ zIndex: 0 }} />
      <div className="login-bg-blob login-bg-blob-2" style={{ zIndex: 0 }} />

      <motion.div
        layout
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '860px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: '32px', paddingBottom: '80px', paddingLeft: '20px', paddingRight: '20px',
          marginTop: activeUpload ? '80px' : '120px',
        }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
      >
        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', gap: '4px', background: '#fff', borderRadius: '14px', padding: '4px', border: '1px solid #e8eaed', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {[
            { id: 'scan', label: 'New Scan', icon: UploadCloud },
            { id: 'history', label: 'Scan History', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                background: activeTab === id ? '#1a73e8' : 'transparent',
                color: activeTab === id ? '#fff' : '#5f6368',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ════════ SCAN TAB ════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div
              key="scan-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Hero text */}
              <motion.div layout style={{ textAlign: 'center', marginBottom: activeUpload ? '28px' : '48px' }}>
                <motion.h1 layout style={{ fontSize: activeUpload ? '26px' : '38px', color: '#202124', fontWeight: '800', letterSpacing: '-1px', marginBottom: '10px' }}>
                  {activeUpload ? `Analyze ${activeOpt?.label}` : (
                    <><span style={{ color: '#1a73e8' }}>Trinetra</span><span style={{ fontWeight: '400', marginLeft: '8px' }}>Console</span></>
                  )}
                </motion.h1>
                <motion.p layout style={{ color: '#5f6368', fontSize: activeUpload ? '15px' : '17px' }}>
                  {activeUpload ? activeOpt?.hint : 'Powered by ZeroTrue AI — Select a media type to begin analysis.'}
                </motion.p>
              </motion.div>

              {/* ── Option Pills ── */}
              <motion.div layout style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: activeUpload ? '28px' : '36px', width: '100%' }}>
                <AnimatePresence mode="popLayout">
                  {options.map((opt, i) => {
                    if (activeUpload && activeUpload !== opt.id) return null;
                    const Icon = opt.icon;
                    const isActive = activeUpload === opt.id;
                    return (
                      <motion.div
                        layout key={opt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: isActive ? 1.04 : 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: activeUpload ? 0 : i * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
                        whileHover={{ scale: isActive ? 1.04 : 1.05, y: isActive ? 0 : -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOptionClick(opt.id)}
                        style={{
                          flex: activeUpload ? '0 1 auto' : '1 1 150px',
                          maxWidth: activeUpload ? '220px' : '185px',
                          background: isActive ? opt.color : '#fff',
                          borderRadius: '20px',
                          padding: isActive ? '14px 24px' : '32px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: isActive ? 'row' : 'column',
                          alignItems: 'center',
                          gap: '14px',
                          boxShadow: isActive ? `0 8px 30px ${opt.color}44` : '0 2px 12px rgba(0,0,0,0.06)',
                          border: `2px solid ${isActive ? opt.color : '#f1f3f4'}`,
                          transition: 'background 0.2s, border 0.2s',
                        }}
                      >
                        <div style={{ background: isActive ? 'rgba(255,255,255,0.25)' : opt.bg, padding: isActive ? '10px' : '18px', borderRadius: '50%' }}>
                          <Icon size={isActive ? 22 : 32} color={isActive ? '#fff' : opt.color} />
                        </div>
                        <span style={{ fontWeight: '800', color: isActive ? '#fff' : '#3c4043', fontSize: isActive ? '13px' : '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {opt.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* ── Upload / Analyze Section ── */}
              <AnimatePresence mode="popLayout">
                {activeUpload && (
                  <motion.div
                    key="upload-zone"
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    {/* ── IDLE: file dropzone ── */}
                    {!file && status === 'idle' && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          background: isDragging ? `${activeOpt?.bg}` : '#fff',
                          borderRadius: '24px',
                          padding: '56px 24px',
                          textAlign: 'center',
                          border: `2px dashed ${isDragging ? activeOpt?.color : '#dadce0'}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          transition: 'all 0.25s',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                        }}
                      >
                        <motion.div animate={{ scale: isDragging ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <UploadCloud size={60} color={activeOpt?.color} style={{ marginBottom: '20px' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '20px', color: '#202124', fontWeight: '700', marginBottom: '8px' }}>
                          {isDragging ? 'Drop it!' : `Drag & Drop your ${activeOpt?.label}`}
                        </h3>
                        <p style={{ color: '#80868b', marginBottom: '28px', fontSize: '14px' }}>{activeOpt?.hint}</p>

                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept={activeOpt?.accepts} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '12px 36px', background: activeOpt?.color, color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: `0 4px 16px ${activeOpt?.color}55`, transition: 'opacity 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                          onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                          Browse Files
                        </button>

                        {/* Text paste mode */}
                        {activeUpload === 'text' && (
                          <div style={{ marginTop: '28px', width: '100%', maxWidth: '480px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                              <div style={{ flex: 1, height: '1px', background: '#e8eaed' }} />
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '1px' }}>or paste text</span>
                              <div style={{ flex: 1, height: '1px', background: '#e8eaed' }} />
                            </div>
                            <textarea
                              placeholder="Paste at least 20 characters of text to analyze..."
                              style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '14px', border: '1px solid #dadce0', resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#fafafa' }}
                              value={textInput}
                              onChange={e => setTextInput(e.target.value)}
                              onFocus={e => e.currentTarget.style.borderColor = '#34A853'}
                              onBlur={e => e.currentTarget.style.borderColor = '#dadce0'}
                            />
                            <button
                              disabled={textInput.trim().length < 20}
                              onClick={() => { if (textInput.trim().length >= 20) { setFile({ name: 'text-input', size: textInput.length }); runTextScan(textInput.trim()); } }}
                              style={{
                                marginTop: '10px', width: '100%', padding: '13px',
                                background: textInput.trim().length >= 20 ? '#34A853' : '#e8eaed',
                                color: textInput.trim().length >= 20 ? '#fff' : '#9aa0a6',
                                border: 'none', borderRadius: '14px', fontWeight: '700', cursor: textInput.trim().length >= 20 ? 'pointer' : 'not-allowed', fontSize: '15px', transition: 'all 0.2s',
                              }}
                            >
                              Analyze Text →
                            </button>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: textInput.trim().length < 20 ? '#ea4335' : '#34A853', textAlign: 'right', transition: 'color 0.2s' }}>
                              {textInput.trim().length} / 20 min characters
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── PROCESSING: uploading / analyzing ── */}
                    {(isProcessing || (file && status === 'idle')) && file && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ background: '#fff', borderRadius: '24px', padding: '56px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f3f4' }}
                      >
                        <img src={logo} alt="Trinetra" style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '20px', borderRadius: '14px' }} />
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }} style={{ marginBottom: '20px' }}>
                          <Loader2 size={36} color={activeOpt?.color} />
                        </motion.div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#202124', marginBottom: '6px' }}>
                          {status === 'uploading' ? `Uploading${uploadProgress < 100 ? ` (${uploadProgress}%)` : ''}…` : 'ZeroTrue AI is Analyzing…'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#80868b', marginBottom: '24px', textAlign: 'center', maxWidth: '360px' }}>
                          {status === 'uploading'
                            ? `Sending ${file?.name || 'file'} to secure servers`
                            : 'Running multimodal detection models — this can take up to 2 minutes for large files.'}
                        </p>
                        {status === 'uploading' && (
                          <div style={{ width: '100%', maxWidth: '360px' }}>
                            <ProgressBar progress={uploadProgress} color={activeOpt?.color} />
                          </div>
                        )}
                        {status === 'analyzing' && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                            {['Metadata scan', 'Artifact detection', 'Frequency analysis', 'Neural fingerprint'].map((step, i) => (
                              <motion.span
                                key={step}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.4 }}
                                style={{ fontSize: '11px', background: activeOpt?.bg, color: activeOpt?.color, padding: '4px 12px', borderRadius: '50px', fontWeight: '700' }}
                              >
                                {step}
                              </motion.span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── ERROR ── */}
                    {hasError && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: '#fff', borderRadius: '24px', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #ea4335', boxShadow: '0 4px 20px rgba(234,67,53,0.08)' }}
                      >
                        <AlertCircle size={48} color="#ea4335" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#202124', marginBottom: '8px' }}>Analysis Failed</h3>
                        <p style={{ fontSize: '15px', color: '#5f6368', textAlign: 'center', maxWidth: '420px', marginBottom: '28px' }}>{error}</p>
                        <button onClick={handleScanNew} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', background: '#ea4335', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
                          <RefreshCw size={16} /> Try Again
                        </button>
                      </motion.div>
                    )}

                    {/* ── RESULT ── */}
                    {isDone && scanResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', bounce: 0.3 }}
                        style={{ width: '100%', background: '#fff', borderRadius: '28px', padding: '40px', border: `2px solid ${risk.color}22`, boxShadow: `0 16px 56px rgba(0,0,0,0.08)`, display: 'flex', flexDirection: 'column', gap: '32px' }}
                      >
                        {/* Result header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f4', paddingBottom: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ background: risk.bg, padding: '14px', borderRadius: '16px' }}>
                              <ShieldAlert size={28} color={risk.color} />
                            </div>
                            <div>
                              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: '#202124' }}>Intelligence Report</h2>
                              <p style={{ fontSize: '13px', color: '#80868b', margin: 0 }}>
                                {file?.name || 'Text input'} &nbsp;·&nbsp; ZeroTrue Analysis Complete
                              </p>
                            </div>
                          </div>
                          <ResultBadge resultType={scanResult.result_type} />
                        </div>

                        {/* Score grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          {[
                            { label: 'Trust Score', value: trustScore != null ? `${trustScore}` : 'N/A', suffix: trustScore != null ? '/100' : '', color: trustScore != null && trustScore > 50 ? '#34A853' : '#EA4335' },
                            { label: 'AI Probability', value: aiPct != null ? `${aiPct}%` : 'N/A', suffix: '', color: aiPct != null && aiPct > 50 ? '#EA4335' : '#34A853' },
                            { label: 'Human Score', value: humanPct != null ? `${humanPct}%` : 'N/A', suffix: '', color: humanPct != null && humanPct > 50 ? '#34A853' : '#EA4335' },
                          ].map(({ label, value, suffix, color }) => (
                            <div key={label} style={{ background: '#f8f9fa', padding: '24px 16px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e8eaed' }}>
                              <div style={{ fontSize: '12px', color: '#80868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>{label}</div>
                              <div style={{ fontSize: '38px', fontWeight: '900', color, lineHeight: '1' }}>
                                {value}<span style={{ fontSize: '16px', color: '#c5c8ca', fontWeight: '600' }}>{suffix}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Probability bar */}
                        <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '20px', border: '1px solid #e8eaed' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase' }}>
                            <span style={{ color: '#34A853' }}>Human / Real</span>
                            <span style={{ color: '#EA4335' }}>AI Generated</span>
                          </div>
                          <div style={{ position: 'relative', height: '12px', background: '#e8eaed', borderRadius: '50px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${humanPct ?? 50}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                              style={{ height: '100%', background: 'linear-gradient(90deg, #34A853, #7BC67E)', borderRadius: '50px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#9aa0a6' }}>
                            <span>{humanPct ?? '—'}%</span>
                            <span>{aiPct ?? '—'}%</span>
                          </div>
                        </div>

                        {/* Risk flag */}
                        <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${risk.color}44`, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '5px', background: risk.color }} />
                          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#202124', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle size={18} color={risk.color} />
                            Risk Assessment
                          </h4>
                          <p style={{ color: '#3c4043', fontSize: '15px', lineHeight: '1.65', margin: 0 }}>
                            Risk level: <strong style={{ color: risk.textColor }}>{risk.label}</strong>.{' '}
                            {scanResult.result_type === 'ai'
                              ? 'This content has a high likelihood of being AI-generated or synthetically manipulated. Do not use for verification or trust-sensitive purposes.'
                              : scanResult.result_type === 'human'
                              ? 'This content shows strong indicators of authentic, human-created media with no significant AI-generation signatures detected.'
                              : 'The analysis is inconclusive. The content shows mixed signals — further manual review is recommended.'}
                          </p>
                        </div>

                        {/* Evidence proofs */}
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#202124', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Fingerprint size={18} color='#1a73e8' />
                            Forensic Evidence
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                              `AI Probability: ${aiPct ?? 'N/A'}% — ${aiPct != null && aiPct > 60 ? 'Strong generative AI signatures detected in the media.' : aiPct != null && aiPct > 35 ? 'Moderate AI indicators found — inconclusive result.' : 'Minimal AI-generation traces found.'}`,
                              `Human Probability: ${humanPct ?? 'N/A'}% — ${humanPct != null && humanPct > 60 ? 'Authentic human-created patterns dominate the analysis.' : 'Human authenticity signals are below confidence threshold.'}`,
                              `ZeroTrue Check ID: ${result?.zerotrue_id || 'N/A'} — This result is logged and traceable.`,
                            ].map((proof, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ display: 'flex', gap: '14px', background: '#f8f9fa', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e8eaed', alignItems: 'flex-start' }}
                              >
                                <div style={{ background: '#e8f0fe', padding: '7px', borderRadius: '50%', flexShrink: 0 }}>
                                  <Info size={16} color='#1a73e8' />
                                </div>
                                <span style={{ fontSize: '14px', color: '#3c4043', lineHeight: '1.6' }}>{proof}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Scan new button */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                          <button
                            onClick={handleScanNew}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 36px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 20px rgba(26,115,232,0.35)', transition: 'opacity 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                          >
                            <RefreshCw size={16} />
                            Scan Another File
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No option selected placeholder */}
              {!activeUpload && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: '12px', color: '#9aa0a6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Info size={14} /> Select a media type above to begin
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════════ HISTORY TAB ════════ */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ width: '100%' }}
            >
              <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #e8eaed', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#202124', margin: '0 0 4px' }}>Scan History</h2>
                    <p style={{ fontSize: '13px', color: '#80868b', margin: 0 }}>
                      {userEmail ? `Results for ${userEmail}` : 'Login to see your personal history'}
                    </p>
                  </div>
                  {userEmail && (
                    <button
                      onClick={() => loadHistory(historyPage)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: '#f1f3f4', color: '#5f6368', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#e8eaed'}
                      onMouseOut={e => e.currentTarget.style.background = '#f1f3f4'}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                  )}
                </div>

                {!userEmail && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#9aa0a6' }}>
                    <History size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>Sign in to see your scan history</p>
                  </div>
                )}

                {userEmail && historyLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={32} color='#1a73e8' style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}

                {userEmail && !historyLoading && history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#9aa0a6' }}>
                    <UploadCloud size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>No scans yet</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>Run your first scan to see results here</p>
                  </div>
                )}

                {!historyLoading && history.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {history.map(scan => <HistoryRow key={scan._id} scan={scan} />)}
                  </div>
                )}

                {/* Pagination */}
                {historyPagination && historyPagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                    <button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      style={{ padding: '8px 16px', background: historyPage === 1 ? '#f1f3f4' : '#1a73e8', color: historyPage === 1 ? '#9aa0a6' : '#fff', border: 'none', borderRadius: '50px', cursor: historyPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: '14px', color: '#5f6368', fontWeight: '600' }}>
                      Page {historyPage} of {historyPagination.pages}
                    </span>
                    <button
                      disabled={historyPage >= historyPagination.pages}
                      onClick={() => setHistoryPage(p => p + 1)}
                      style={{ padding: '8px 16px', background: historyPage >= historyPagination.pages ? '#f1f3f4' : '#1a73e8', color: historyPage >= historyPagination.pages ? '#9aa0a6' : '#fff', border: 'none', borderRadius: '50px', cursor: historyPage >= historyPagination.pages ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
