export function homePath(role) {
  return role === 'ADMIN' ? '/admin' : '/dashboard';
}
