import { request } from './request.js';

export function latestRecommendations(token, signal) {
  return request('me/recommendations/latest', { token, signal });
}

export function generateRecommendations(token) {
  return request('me/recommendations', { method: 'POST', token });
}
