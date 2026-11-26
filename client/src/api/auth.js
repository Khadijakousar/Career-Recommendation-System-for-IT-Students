import { request } from './request.js';

export function register(body) {
  return request('auth/register', { method: 'POST', body });
}

export function completeSignup(body) {
  return request('auth/complete-signup', { method: 'POST', body });
}

export function requestEmailVerification(token) {
  return request('auth/email-verification', { method: 'POST', token });
}

export function verifyEmail(body) {
  return request('auth/verify-email', { method: 'POST', body });
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

export function requestPasswordReset(body) {
  return request('auth/forgot-password', { method: 'POST', body });
}

export function resetPassword(body) {
  return request('auth/reset-password', { method: 'POST', body });
}
