import { request } from './request.js';

export function register(body) {
  return request('auth/register', { method: 'POST', body });
}

export function login(body) {
  return request('auth/login', { method: 'POST', body });
}

export function getCurrentUser(token, signal) {
  return request('auth/me', { token, signal });
}

export function changePassword(token, body) {
  return request('auth/password', { method: 'PUT', token, body });
}
