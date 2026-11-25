import { Link } from 'react-router-dom';

export default function AuthLayout({ title, description, children }) {
  return (
    <main className="min-h-screen border-t-4 border-accent bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 sm:px-12">
        <header className="border-b border-line py-6">
          <Link to="/" className="auth-link">
            Career Recommendation System
          </Link>
        </header>
        <div className="grid gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-20 lg:gap-20">
          <div>
            <h1 className="font-display text-5xl leading-[1.03] tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xs leading-relaxed text-muted">
              {description}
            </p>
          </div>
          <section className="w-full max-w-lg border-t border-line pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
