import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminStats } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';

const metrics = [
  ['students', 'Students'],
  ['careers', 'Careers'],
  ['skills', 'Skills'],
  ['skillsAssessmentsCompleted', 'Completed skills assessments'],
  ['interestAssessmentsCompleted', 'Completed interest assessments'],
];

export default function AdminHome() {
  const { token } = useAuth();
  const load = useCallback((signal) => adminStats(token, signal), [token]);
  const result = useRemoteData(load);

  return (
    <>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
        Admin overview
      </h1>
      <p className="mt-2 text-muted">
        Manage the catalog used in student assessments and recommendations.
      </p>
      <div className="mt-8 max-w-2xl">
        <RemoteStatus {...result}>
          <dl className="divide-y divide-line border-y border-line">
            {metrics.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 py-4"
              >
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {result.data?.[key]}
                </dd>
              </div>
            ))}
          </dl>
        </RemoteStatus>
        <Link
          className="auth-button mt-6 inline-flex items-center"
          to="/admin/careers"
        >
          Manage careers
        </Link>
      </div>
    </>
  );
}
