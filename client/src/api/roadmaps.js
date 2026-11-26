import { request } from './request.js';

export function listCareers(token, signal) {
  return request('careers', { token, signal });
}

export async function getCareerDetails(slug, token, signal) {
  const career = await request(`careers/${encodeURIComponent(slug)}`, {
    token,
    signal,
  });
  try {
    const gap = await request(
      `me/careers/${encodeURIComponent(career.id)}/gap`,
      { token, signal },
    );
    return { career, gap };
  } catch (error) {
    if (
      error.status === 400 &&
      error.message === 'Complete the skills assessment first'
    ) {
      return { career, gap: null };
    }
    throw error;
  }
}

export function generateRoadmap(careerId, token) {
  return request(`me/careers/${encodeURIComponent(careerId)}/roadmap`, {
    method: 'POST',
    token,
  });
}

export function listRoadmaps(token, signal) {
  return request('me/roadmaps', { token, signal });
}

export function getRoadmap(id, token, signal) {
  return request(`me/roadmaps/${encodeURIComponent(id)}`, { token, signal });
}

export function updateRoadmapStep(id, status, token) {
  return request(`me/roadmap-steps/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export function applyRoadmapRating(id, token) {
  return request(`me/roadmap-steps/${encodeURIComponent(id)}/apply-rating`, {
    method: 'POST',
    token,
  });
}
