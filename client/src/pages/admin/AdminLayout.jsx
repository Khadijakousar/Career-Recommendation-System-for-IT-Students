import { NavLink, Outlet } from 'react-router-dom';
import SkipLink from '../../components/SkipLink.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { catalogSections } from './catalogConfig.js';

function NavigationLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-accent motion-reduce:transition-none lg:border-b-0 lg:border-l-2 ${isActive ? 'border-accent bg-accent/8 text-accent' : 'border-transparent text-muted hover:bg-accent/5 hover:text-ink'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen border-t-4 border-accent bg-paper text-ink">
      <SkipLink />
      <div className="mx-auto max-w-7xl px-4 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line py-5">
          <NavLink to="/admin" className="auth-link">
            Career Recommendation System
          </NavLink>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="break-all text-muted">{user.name}</span>
            <button type="button" onClick={signOut} className="auth-link">
              Sign out
            </button>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <aside className="border-b border-line py-3 lg:border-r lg:border-b-0 lg:py-9 lg:pr-5">
            <nav
              aria-label="Admin catalog"
              className="flex flex-wrap gap-1 lg:flex-col"
            >
              <NavigationLink to="/admin">Overview</NavigationLink>
              {Object.entries(catalogSections).map(([key, { title }]) => (
                <NavigationLink key={key} to={`/admin/${key}`}>
                  {title}
                </NavigationLink>
              ))}
            </nav>
          </aside>
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 py-7 sm:py-10"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
