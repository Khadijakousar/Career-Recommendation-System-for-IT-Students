import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listRoadmaps } from '../../api/roadmaps.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import StudentPage from './StudentPage.jsx';

export default function RoadmapListPage() {
  const { token } = useAuth();
  const load = useCallback((signal) => listRoadmaps(token, signal), [token]);
  const result = useRemoteData(load);
  return (
    <StudentPage
      title="Learning roadmaps"
      description="Open a saved roadmap to track what you’ve completed."
    >
      <RemoteStatus {...result}>
        {result.data?.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {result.data.map(
              ({ id, career, completedSteps, totalSteps, progressPercent }) => (
                <li key={id}>
                  <Link
                    to={`/roadmaps/${encodeURIComponent(id)}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-2 py-4 hover:bg-accent/5 focus-visible:outline-accent"
                  >
                    <span>
                      <span className="block font-semibold text-accent">
                        {career.title}
                      </span>
                      <span className="text-sm text-muted">
                        {completedSteps} of {totalSteps} steps done
                      </span>
                    </span>
                    <strong className="tabular-nums">{progressPercent}%</strong>
                  </Link>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="border-y border-line py-4 text-muted">
            No saved roadmaps yet.{' '}
            <Link to="/careers" className="auth-link">
              Browse careers
            </Link>{' '}
            to start one.
          </p>
        )}
      </RemoteStatus>
    </StudentPage>
  );
}
