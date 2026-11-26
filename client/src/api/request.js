import { apiUrl } from './config.js';

export async function request(
  path,
  { method = 'GET', body, token, signal } = {},
) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeout = AbortSignal.timeout(10000);
  const response = await fetch(`${apiUrl}/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (response.status === 204) return;
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.error?.message || 'Request failed');
    error.status = response.status;
    error.fields = result.error?.fields;
    throw error;
  }

  return result.data;
}
