import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(jobId, onMessage) {
  const ws      = useRef(null);
  const onMsgRef = useRef(onMessage);
  onMsgRef.current = onMessage;

  const connect = useCallback(() => {
    if (!jobId) return;
    const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001')
      .replace('http', 'ws')
      .replace('/api', '');

    ws.current = new WebSocket(`${WS_URL}?jobId=${jobId}`);

    ws.current.onmessage = (e) => {
      try { onMsgRef.current(JSON.parse(e.data)); }
      catch { /* ignore malformed */ }
    };

    ws.current.onerror = () => ws.current?.close();
  }, [jobId]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);
}