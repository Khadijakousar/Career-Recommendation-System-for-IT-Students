import { request } from './request.js';

export function studentProfile(token, signal) {
  return request('profile', { token, signal }).then((profile) => ({ profile }));
}

export function saveStudentProfile(token, body) {
  return request('profile', { token, method: 'PUT', body });
}

export async function studentSkills(token, signal) {
  const [groups, ratings] = await Promise.all([
    request('skills', { token, signal }),
    request('me/skills', { token, signal }),
  ]);
  return { groups, ratings };
}

export function saveStudentSkills(token, body) {
  return request('me/skills', { token, method: 'PUT', body });
}

export async function studentInterests(token, signal) {
  const [questions, answers] = await Promise.all([
    request('interests/questions', { token, signal }),
    request('me/interests', { token, signal }),
  ]);
  return { questions, answers };
}

export function saveStudentInterests(token, body) {
  return request('me/interests', { token, method: 'PUT', body });
}
