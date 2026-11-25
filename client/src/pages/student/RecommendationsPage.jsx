import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  generateRecommendations,
  latestRecommendations,
} from '../../api/recommendations.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

const percentage = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  style: 'percent',
});
const runDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatScore(score) {
  return percentage.format(score / 100);
}

function MatchScore({ label, score }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">{formatScore(score)}</span>
      </div>
      <meter
        aria-label={label}
        min={0}
        max={100}
        value={score}
        className="sr-only"
      />
      <div aria-hidden="true" className="mt-1 h-2 overflow-hidden bg-accent/10">
        <div className="h-full bg-accent" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CareerMatches({ run, topCount }) {
  if (!run.results.length) {
    return (
      <p className="border-y border-line py-5 text-muted">
        No careers are available yet.
      </p>
    );
  }
  const skillsOnly = run.mode === 'SKILLS_ONLY';

  return (
    <div className="space-y-4">
      {skillsOnly && (
        <p className="border-l-2 border-accent bg-accent/5 p-3 text-sm text-muted">
          These matches use your skill ratings. Complete the{' '}
          <Link to="/assessment/interests" className="auth-link">
            interest assessment
          </Link>{' '}
          and generate new matches to include your interests.
        </p>
      )}
      <ol className="space-y-3">
        {run.results.map(
          ({
            careerId,
            careerTitle,
            career,
            skillScore,
            interestScore,
            totalScore,
            rank,
          }) => (
            <li
              key={careerId}
              className={`border p-4 sm:p-5 ${rank <= topCount ? 'border-line border-l-4 border-l-accent bg-accent/5' : 'border-line'}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="min-w-0 wrap-anywhere text-lg font-semibold">
                  <span className="mr-2 text-sm tabular-nums text-muted">
                    {rank}.
                  </span>
                  <Link
                    to={`/careers/${encodeURIComponent(career.slug)}`}
                    className="underline decoration-line underline-offset-4 hover:decoration-accent focus-visible:outline-accent"
                  >
                    {careerTitle}
                  </Link>
                </h3>
                <p className="whitespace-nowrap text-sm text-muted">
                  <strong className="text-xl tabular-nums text-accent">
                    {formatScore(totalScore)}
                  </strong>{' '}
                  match
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5">
                <MatchScore label="Skill match" score={skillScore} />
                {!skillsOnly && (
                  <MatchScore label="Interest match" score={interestScore} />
                )}
              </div>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}

function Recommendations({ initial, token }) {
  const [savedResults, setSavedResults] = useState(initial);
  const save = useStudentSave(async () => {
    setSavedResults(await generateRecommendations(token));
  });
  const { run, topCount } = savedResults;

  return (
    <div className="space-y-5 border-t border-line pt-5">
      <button
        type="button"
        className="auth-button"
        disabled={save.pending}
        onClick={() => save.submit()}
      >
        {save.pending
          ? 'Generating…'
          : run
            ? 'Generate new matches'
            : 'Generate matches'}
      </button>
      <SaveFeedback {...save} message="Recommendations updated." />
      {save.error?.status === 400 && (
        <Link className="auth-link inline-block" to="/assessment/skills">
          Go to skills assessment
        </Link>
      )}
      {run ? (
        <section aria-labelledby="latest-matches" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="latest-matches" className="font-display text-2xl">
              Latest matches
            </h2>
            <time dateTime={run.createdAt} className="text-sm text-muted">
              {runDate.format(new Date(run.createdAt))}
            </time>
          </div>
          <CareerMatches run={run} topCount={topCount} />
        </section>
      ) : (
        <p className="text-sm text-muted">
          No matches have been generated yet.
        </p>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const { token } = useAuth();
  const load = useCallback(
    (signal) => latestRecommendations(token, signal),
    [token],
  );
  const result = useRemoteData(load);

  return (
    <StudentPage
      title="Career recommendations"
      description="Explore careers ranked by how closely they match your assessments."
    >
      <RemoteStatus {...result}>
        {result.data && <Recommendations initial={result.data} token={token} />}
      </RemoteStatus>
    </StudentPage>
  );
}
