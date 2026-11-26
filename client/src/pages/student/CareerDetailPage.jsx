import { lazy, Suspense, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { generateRoadmap, getCareerDetails } from '../../api/roadmaps.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

const SkillGapChart = lazy(() => import('./SkillGapChart.jsx'));

function SkillRequirements({ entries }) {
  return (
    <section aria-labelledby="skill-requirements" className="space-y-3">
      <h2 id="skill-requirements" className="font-display text-2xl">
        Skill requirements
      </h2>
      <table className="w-full table-fixed border-y border-line text-left text-sm">
        <thead className="bg-accent/5 text-muted">
          <tr>
            <th scope="col" className="w-[40%] p-2">
              Skill
            </th>
            <th scope="col" className="p-2">
              Yours
            </th>
            <th scope="col" className="p-2">
              Target
            </th>
            <th scope="col" className="p-2">
              Gap
            </th>
            <th scope="col" className="p-2">
              Priority
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map(
            ({
              skillId,
              skill,
              studentLevel,
              requiredLevel,
              weight,
              priority,
              gap,
            }) => (
              <tr key={skillId}>
                <th scope="row" className="wrap-anywhere p-2 font-semibold">
                  {skill.name}
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    Importance {weight} of 5
                  </span>
                </th>
                <td className="p-2 tabular-nums">{studentLevel ?? '—'}</td>
                <td className="p-2 tabular-nums">{requiredLevel}</td>
                <td className="p-2 tabular-nums">
                  {gap ?? (studentLevel === undefined ? '—' : 'Met')}
                </td>
                <td className="p-2 tabular-nums">{priority ?? '—'}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
}

function CareerDetails({ career, gap, token }) {
  const navigate = useNavigate();
  const generate = useStudentSave(async () => {
    const roadmap = await generateRoadmap(career.id, token);
    navigate(`/roadmaps/${encodeURIComponent(roadmap.id)}`);
  });
  const hasRequirements = career.requiredSkills.length > 0;
  const entries = gap ? [...gap.gaps, ...gap.met] : career.requiredSkills;

  return (
    <StudentPage title={career.title} description={career.description}>
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Interest area · {career.interestArea.name}
        </p>
        {!hasRequirements && (
          <p className="border-y border-line py-4 text-muted">
            No skill requirements have been added for this career.
          </p>
        )}
        {!gap && (
          <p className="border-l-2 border-accent bg-accent/5 p-3 text-sm text-muted">
            Complete the{' '}
            <Link to="/assessment/skills" className="auth-link">
              skills assessment
            </Link>{' '}
            to see your gaps and generate a roadmap.
          </p>
        )}
        {gap && hasRequirements && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
            <p className="font-semibold">
              Skill readiness{' '}
              <span className="ml-2 text-xl tabular-nums text-accent">
                {gap.readinessPercent}%
              </span>
            </p>
            <button
              type="button"
              className="auth-button"
              disabled={generate.pending}
              onClick={() => generate.submit()}
            >
              {generate.pending ? 'Generating…' : 'Generate roadmap'}
            </button>
          </div>
        )}
        <SaveFeedback error={generate.error} />
        {gap?.gaps.length > 0 && (
          <Suspense
            fallback={
              <p role="status" className="text-muted">
                Loading chart…
              </p>
            }
          >
            <SkillGapChart gaps={gap.gaps} />
          </Suspense>
        )}
        {gap && hasRequirements && gap.gaps.length === 0 && (
          <p className="text-sm font-semibold text-accent">
            You meet every skill requirement for this career.
          </p>
        )}
        {hasRequirements && <SkillRequirements entries={entries} />}
      </div>
    </StudentPage>
  );
}

export default function CareerDetailPage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const load = useCallback(
    (signal) => getCareerDetails(slug, token, signal),
    [slug, token],
  );
  const result = useRemoteData(load);
  return (
    <RemoteStatus {...result}>
      {result.data && <CareerDetails {...result.data} token={token} />}
    </RemoteStatus>
  );
}
