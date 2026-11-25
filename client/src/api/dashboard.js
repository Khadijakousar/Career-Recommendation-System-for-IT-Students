import { request } from './request.js';

export function getDashboard(token, signal) {
  return request('me/dashboard', { token, signal });
}
