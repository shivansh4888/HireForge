import { useEffect, useEffectEvent } from 'react';

export function useWebSocket(jobId, onMessage) {
  const handleMessage = useEffectEvent((payload) => {
    onMessage?.(payload);
  });

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
      .replace('http', 'ws')
      .replace('/api', '');
    const socket = new WebSocket(`${wsUrl}?jobId=${jobId}`);

    socket.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data));
      } catch {
        // Ignore malformed WebSocket messages.
      }
    };

    socket.onerror = () => socket.close();

    return () => socket.close();
  }, [jobId]);
}
