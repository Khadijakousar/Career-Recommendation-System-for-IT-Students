import { apiUrl } from './config.js';

export async function checkHealth(signal) {
  const response = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  });

  if (response.status === 503) {
    return 'database-unavailable';
  }

  if (!response.ok) {
    return 'api-unavailable';
  }

  const result = await response.json();
  return result.data?.status === 'ok' ? 'ready' : 'api-unavailable';
}
