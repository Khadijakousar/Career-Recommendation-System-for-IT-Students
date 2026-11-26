import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth } from '../api/health.js';

const messages = {
  checking: 'Checking the API and database…',
  ready: 'API and database connected',
  'database-unavailable': 'The API is running. PostgreSQL is unavailable.',
  'api-unavailable': 'The API could not be reached.',
};

export default function SetupPage() {
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    checkHealth(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatus(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('api-unavailable');
        }
      });

    return () => controller.abort();
  }, [attempt]);

  function recheck() {
    setStatus('checking');
    setAttempt((previous) => previous + 1);
  }

  return (
    <main className="min-h-screen border-t-4 border-accent bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-12 sm:py-24">
        <h1 className="max-w-3xl font-display text-[clamp(2.25rem,10vw,3rem)] leading-[0.97] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Career Recommendation System
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Explore IT careers, see which skills you need, and plan what to learn
          next.
        </p>
        <Link to="/login" className="auth-button mt-6 inline-flex items-center">
          Sign in
        </Link>
        <section
          aria-labelledby="connection-title"
          className="mt-12 grid gap-4 border-y border-line py-5 sm:mt-16 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
        >
          <h2 id="connection-title" className="text-sm font-semibold">
            Local setup
          </h2>
          <p role="status" className="text-sm text-muted">
            {messages[status]}
          </p>
          <button
            type="button"
            onClick={recheck}
            disabled={status === 'checking'}
            className="justify-self-start border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50 motion-reduce:transition-none"
          >
            Check again
          </button>
        </section>
      </div>
    </main>
  );
}
