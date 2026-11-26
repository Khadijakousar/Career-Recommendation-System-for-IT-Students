import { request } from './request.js';

export function listCatalog(
  section,
  token,
  signal,
  { page = 1, limit = 12, skillId } = {},
) {
  const query = new URLSearchParams({ page, limit });
  if (skillId) query.set('skillId', skillId);
  return request(`admin/${section}?${query}`, { token, signal });
}

export async function catalogOptions(section, token, signal) {
  const options = [];
  for (let page = 1; ; page += 1) {
    const { items, total } = await listCatalog(section, token, signal, {
      page,
      limit: 100,
    });
    options.push(...items.map(({ id, name }) => ({ value: id, label: name })));
    if (!items.length || page * 100 >= total) return options;
  }
}

export function adminStats(token, signal) {
  return request('admin/stats', { token, signal });
}

export function saveCatalog(section, token, body, id) {
  return request(`admin/${section}${id ? `/${encodeURIComponent(id)}` : ''}`, {
    token,
    body,
    method: id ? 'PUT' : 'POST',
  });
}

export function deleteCatalog(section, token, id) {
  return request(`admin/${section}/${encodeURIComponent(id)}`, {
    token,
    method: 'DELETE',
  });
}

export function saveCareerSkills(token, careerId, body) {
  return request(`admin/careers/${encodeURIComponent(careerId)}/skills`, {
    token,
    body,
    method: 'PUT',
  });
}
