import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navigation = [
  ['/dashboard', 'Dashboard'],
  ['/profile', 'Profile'],
  ['/assessment/skills', 'Skills'],
  ['/assessment/interests', 'Interests'],
  ['/recommendations', 'Recommendations'],
];

export default function StudentLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen border-t-4 border-accent bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-4 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line py-5">
          <NavLink className="auth-link" to="/dashboard">
            Career Recommendation System
          </NavLink>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="wrap-anywhere text-muted">{user.name}</span>
            <button type="button" className="auth-link" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>
        <nav
          aria-label="Student workspace"
          className="flex flex-wrap gap-x-1 border-b border-line py-2"
        >
          {navigation.map(([path, title]) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                `border-b-2 px-2 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-accent motion-reduce:transition-none sm:px-3 ${isActive ? 'border-accent bg-accent/8 text-accent' : 'border-transparent text-muted hover:bg-accent/5 hover:text-ink'}`
              }
            >
              {title}
            </NavLink>
          ))}
        </nav>
        <main className="py-8 sm:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
