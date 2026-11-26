import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listCareers } from '../../api/roadmaps.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import StudentPage from './StudentPage.jsx';

export default function CareerListPage() {
  const { token } = useAuth();
  const load = useCallback((signal) => listCareers(token, signal), [token]);
  const result = useRemoteData(load);

  return (
    <StudentPage
      title="Browse careers"
      description="Explore IT career paths and see which skills each one requires."
    >
      <RemoteStatus {...result}>
        {result.data?.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {result.data.map(
              ({ id, title, slug, description, interestArea }) => (
                <li key={id} className="py-4 sm:py-5">
                  <div className="flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between">
                    <h2 className="min-w-0 wrap-anywhere text-xl font-semibold">
                      <Link
                        to={`/careers/${encodeURIComponent(slug)}`}
                        className="text-accent underline decoration-line underline-offset-4 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        {title}
                      </Link>
                    </h2>
                    <span className="min-w-0 wrap-anywhere text-sm text-muted">
                      {interestArea.name}
                    </span>
                  </div>
                  <p className="mt-2 max-w-prose wrap-anywhere leading-relaxed text-muted">
                    {description}
                  </p>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="border-y border-line py-4 text-muted">
            No careers are available yet.
          </p>
        )}
      </RemoteStatus>
    </StudentPage>
  );
}
