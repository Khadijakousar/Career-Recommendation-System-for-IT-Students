import { lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/dashboard.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { formatMatchDate, formatMatchScore } from './matchFormatting.js';

const DashboardSkillsChart = lazy(() => import('./DashboardSkillsChart.jsx'));

function OverviewCard({ title, detail, complete, action, to }) {
  return (
    <li
      className={`min-w-0 border border-line p-4 ${complete ? 'bg-accent/5' : ''}`}
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      {action && (
        <Link className="auth-link mt-3 inline-block" to={to}>
          {action}
        </Link>
      )}
    </li>
  );
}

function AssessmentOverview({
  profileComplete,
  assessments: { skills, interests },
}) {
  return (
    <ul
      aria-label="Profile and assessment status"
      className="grid gap-3 sm:grid-cols-3"
    >
      <OverviewCard
        title="Academic profile"
        detail={profileComplete ? 'Profile saved' : 'Profile incomplete'}
        complete={profileComplete}
        to="/profile"
        action={profileComplete ? 'Edit profile' : 'Complete profile'}
      />
      <OverviewCard
        title="Skills assessment"
        detail={
          skills.totalCount
            ? `${skills.completedCount} of ${skills.totalCount} skills rated`
            : 'No skills listed yet'
        }
        complete={skills.complete}
        to="/assessment/skills"
        action={
          skills.totalCount > 0 &&
          (skills.complete
            ? 'Review skill ratings'
            : skills.completedCount
              ? 'Continue skill ratings'
              : 'Rate your skills')
        }
      />
      <OverviewCard
        title="Interest assessment"
        detail={
          interests.totalCount
            ? `${interests.completedCount} of ${interests.totalCount} questions answered`
            : 'No questions available yet'
        }
        complete={interests.complete}
        to="/assessment/interests"
        action={
          interests.totalCount > 0 &&
          (interests.complete
            ? 'Review interest answers'
            : interests.completedCount
              ? 'Continue questionnaire'
              : 'Answer the questionnaire')
        }
      />
    </ul>
  );
}

function LatestMatches({ run, rated }) {
  return (
    <section aria-labelledby="dashboard-matches" className="min-w-0 space-y-3">
      <h2 id="dashboard-matches" className="font-display text-2xl">
        Top career matches
      </h2>
      {run?.results.length ? (
        <>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-muted">
            <time dateTime={run.createdAt}>
              {formatMatchDate(run.createdAt)}
            </time>
            <p>
              {run.mode === 'SKILLS_ONLY'
                ? 'Skills only'
                : 'Skills and interests'}
            </p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {run.results.map(
              ({ careerId, careerTitle, career, rank, totalScore }) => (
                <li
                  key={careerId}
                  className="flex items-baseline justify-between gap-3 py-3"
                >
                  <div className="min-w-0 wrap-anywhere">
                    <span className="mr-2 text-sm tabular-nums text-muted">
                      {rank}.
                    </span>
                    <Link
                      to={`/careers/${encodeURIComponent(career.slug)}`}
                      className="auth-link"
                    >
                      {careerTitle}
                    </Link>
                  </div>
                  <strong className="tabular-nums text-accent">
                    {formatMatchScore(totalScore)}
                  </strong>
                </li>
              ),
            )}
          </ol>
        </>
      ) : (
        <p className="border-y border-line py-4 text-sm text-muted">
          {run
            ? 'No careers were available in your last run.'
            : rated
              ? 'Generate matches to see which careers fit your assessments.'
              : 'Save skill ratings to generate your first matches.'}
        </p>
      )}
      {rated > 0 && (
        <Link className="auth-link inline-block" to="/recommendations">
          {run ? 'View recommendations' : 'Open recommendations'}
        </Link>
      )}
    </section>
  );
}

function RoadmapOverview({ activeRoadmaps, savedRoadmapCount }) {
  return (
    <section aria-labelledby="dashboard-roadmaps" className="min-w-0 space-y-3">
      <h2 id="dashboard-roadmaps" className="font-display text-2xl">
        Active roadmaps
      </h2>
      {activeRoadmaps.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {activeRoadmaps.map(
            ({ id, career, completedSteps, totalSteps, progressPercent }) => (
              <li key={id} className="space-y-2 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    className="auth-link min-w-0 wrap-anywhere"
                    to={`/roadmaps/${encodeURIComponent(id)}`}
                  >
                    {career.title}
                  </Link>
                  <strong className="text-sm tabular-nums text-accent">
                    {progressPercent}%
                  </strong>
                </div>
                <div
                  aria-hidden="true"
                  className="h-2 overflow-hidden bg-accent/10"
                >
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted">
                  {completedSteps} of {totalSteps} steps done
                </p>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="border-y border-line py-4 text-sm text-muted">
          {savedRoadmapCount
            ? 'All saved roadmaps are complete.'
            : 'Choose a career from your matches to generate a roadmap.'}
        </p>
      )}
      {savedRoadmapCount > 0 && (
        <Link className="auth-link inline-block" to="/roadmaps">
          View all roadmaps
        </Link>
      )}
    </section>
  );
}

function AcademicDetails({ profile }) {
  return (
    <section aria-labelledby="dashboard-profile" className="min-w-0 space-y-3">
      <h2 id="dashboard-profile" className="font-display text-2xl">
        Academic details
      </h2>
      {profile ? (
        <dl className="space-y-3 border-y border-line py-4 text-sm">
          <div>
            <dt className="text-muted">Program</dt>
            <dd className="wrap-anywhere font-semibold">{profile.program}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-muted">Semester</dt>
              <dd className="font-semibold">{profile.semester}</dd>
            </div>
            <div>
              <dt className="text-muted">CGPA</dt>
              <dd className="font-semibold">
                {profile.cgpa === null ? 'Not added' : profile.cgpa.toFixed(2)}
              </dd>
            </div>
          </div>
          {profile.completedCourses.length > 0 && (
            <div>
              <dt className="text-muted">Completed courses</dt>
              <dd>
                <ul className="list-disc space-y-1 pl-4">
                  {profile.completedCourses.map((course, index) => (
                    <li key={`${index}-${course}`} className="wrap-anywhere">
                      {course}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="border-y border-line py-4 text-sm text-muted">
          Add your program and semester to see your details here.
        </p>
      )}
    </section>
  );
}

function Dashboard({ data }) {
  const rated = data.assessments.skills.completedCount;
  return (
    <div className="space-y-8">
      <AssessmentOverview
        profileComplete={data.profileComplete}
        assessments={data.assessments}
      />
      <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <LatestMatches run={data.latestRecommendations} rated={rated} />
        <RoadmapOverview
          activeRoadmaps={data.activeRoadmaps}
          savedRoadmapCount={data.savedRoadmapCount}
        />
        <section
          aria-labelledby="dashboard-skills"
          className="min-w-0 space-y-3"
        >
          <h2 id="dashboard-skills" className="font-display text-2xl">
            Skills by category
          </h2>
          {rated > 0 ? (
            <>
              <p className="text-sm text-muted">
                Average saved rating on the 0–5 scale.
              </p>
              <Suspense
                fallback={
                  <p role="status" className="text-sm text-muted">
                    Loading chart…
                  </p>
                }
              >
                <DashboardSkillsChart groups={data.skillGroups} />
              </Suspense>
            </>
          ) : (
            <p className="border-y border-line py-4 text-sm text-muted">
              Your ratings will appear here after you save the skills
              assessment.
            </p>
          )}
        </section>
        <AcademicDetails profile={data.profile} />
      </div>
    </div>
  );
}

export default function StudentHome() {
  const { token } = useAuth();
  const load = useCallback((signal) => getDashboard(token, signal), [token]);
  const result = useRemoteData(load);
  return (
    <>
      <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        Student dashboard
      </h1>
      <div className="mt-6">
        <RemoteStatus {...result}>
          {result.data && <Dashboard data={result.data} />}
        </RemoteStatus>
      </div>
    </>
  );
}
