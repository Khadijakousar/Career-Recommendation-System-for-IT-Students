import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homePath } from './homePath.js';

export function SessionGate() {
  const { status, retry, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-paper p-6 text-ink sm:p-12">
        <p role="status">Checking your session…</p>
      </main>
    );
  }

  if (status === 'unavailable') {
    return (
      <main className="min-h-screen bg-paper p-6 text-ink sm:p-12">
        <p role="alert">We couldn’t check your session. Please try again.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="auth-button" onClick={retry}>
            Try again
          </button>
          <button type="button" className="auth-link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}

export function PublicAuthRoute() {
  const { user } = useAuth();
  return user ? <Navigate to={homePath(user.role)} replace /> : <Outlet />;
}

export function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user.role === role ? (
    <Outlet />
  ) : (
    <Navigate to={homePath(user.role)} replace />
  );
}
