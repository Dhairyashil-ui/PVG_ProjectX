import { useState, useCallback } from 'react';
import { analyzeFile, analyzeText, fetchHistory } from '../services/api';

export function useDetection(userEmail) {
  const [status, setStatus] = useState('idle'); // idle | uploading | analyzing | done | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ── Run file-based scan ── */
  const runFileScan = useCallback(
    async (file) => {
      setStatus('uploading');
      setUploadProgress(0);
      setResult(null);
      setError(null);

      try {
        const data = await analyzeFile(file, userEmail, (pct) => {
          setUploadProgress(pct);
          if (pct === 100) setStatus('analyzing');
        });
        setResult(data);
        setStatus('done');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    },
    [userEmail]
  );

  /* ── Run text scan ── */
  const runTextScan = useCallback(
    async (text) => {
      setStatus('analyzing');
      setUploadProgress(0);
      setResult(null);
      setError(null);

      try {
        const data = await analyzeText(text, userEmail);
        setResult(data);
        setStatus('done');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    },
    [userEmail]
  );

  /* ── Load history ── */
  const loadHistory = useCallback(
    async (page = 1) => {
      if (!userEmail) return;
      setHistoryLoading(true);
      try {
        const data = await fetchHistory(userEmail, page, 10);
        setHistory(data.scans || []);
        setHistoryPagination(data.pagination || null);
      } catch (err) {
        console.error('History load error:', err.message);
      } finally {
        setHistoryLoading(false);
      }
    },
    [userEmail]
  );

  /* ── Reset ── */
  const reset = useCallback(() => {
    setStatus('idle');
    setUploadProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    uploadProgress,
    result,
    error,
    history,
    historyPagination,
    historyLoading,
    runFileScan,
    runTextScan,
    loadHistory,
    reset,
  };
}
