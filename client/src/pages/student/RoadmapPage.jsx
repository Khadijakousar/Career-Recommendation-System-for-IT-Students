import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  applyRoadmapRating,
  generateRoadmap,
  getRoadmap,
  updateRoadmapStep,
} from '../../api/roadmaps.js';
import FormField from '../../components/FormField.jsx';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

const statuses = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
];
const stages = ['Foundation', 'Intermediate', 'Advanced'];

function StepResources({ resources }) {
  if (!resources.length)
    return (
      <p className="text-sm text-muted">
        No learning resources are listed for this skill.
      </p>
    );
  return (
    <ul aria-label="Learning resources" className="space-y-2">
      {resources.map(({ id, url, title, provider, isFree }) => (
        <li key={id} className="text-sm">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="auth-link wrap-anywhere"
          >
            {title}
          </a>
          <span className="ml-2 text-xs text-muted">
            {provider ? `${provider} · ` : ''}
            {isFree ? 'Free' : 'Paid'}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RoadmapStep({
  step,
  pending,
  confirming,
  onStatus,
  onOffer,
  onConfirm,
  onSkip,
}) {
  const { id, order, skill, startLevel, targetLevel, status } = step;
  return (
    <li className="space-y-4 border-t border-line py-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div>
          <h2 className="wrap-anywhere text-lg font-semibold">
            <span className="mr-2 text-sm tabular-nums text-muted">
              {order}.
            </span>
            {skill.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {stages[skill.stage - 1]} · Starting level {startLevel} · Target
            level {targetLevel}
          </p>
        </div>
        <fieldset className="min-w-0" disabled={pending}>
          <FormField
            label={`Status for ${skill.name}`}
            value={status}
            options={statuses}
            onChange={(value) => onStatus(id, value)}
          />
        </fieldset>
      </div>
      <StepResources resources={skill.resources} />
      {confirming ? (
        <div className="space-y-3 border-l-2 border-accent bg-accent/5 p-3">
          <p className="text-sm">
            Update your saved rating for <strong>{skill.name}</strong> to at
            least level {targetLevel}?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="auth-button"
              disabled={pending}
              onClick={() => onConfirm(id)}
            >
              Confirm update
            </button>
            <button
              type="button"
              className="catalog-button"
              disabled={pending}
              onClick={onSkip}
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        status === 'DONE' && (
          <button
            type="button"
            className="catalog-button"
            disabled={pending}
            onClick={() => onOffer(id)}
          >
            Update skill rating
          </button>
        )
      )}
    </li>
  );
}

function RoadmapEditor({ initial, token }) {
  const [roadmap, setRoadmap] = useState(initial);
  const [confirmStepId, setConfirmStepId] = useState(null);
  const [message, setMessage] = useState('');
  const save = useStudentSave((operation) => operation());
  const { career, steps, completedSteps, totalSteps, progressPercent } =
    roadmap;

  function onStatus(id, status) {
    save.submit(async () => {
      setRoadmap(await updateRoadmapStep(id, status, token));
      setConfirmStepId(status === 'DONE' ? id : null);
      setMessage('Step status saved.');
    });
  }

  function onConfirm(id) {
    save.submit(async () => {
      const { level } = await applyRoadmapRating(id, token);
      setConfirmStepId(null);
      setMessage(`Skill rating saved at level ${level}.`);
    });
  }

  function regenerate() {
    save.submit(async () => {
      setRoadmap(await generateRoadmap(career.id, token));
      setConfirmStepId(null);
      setMessage('Roadmap refreshed.');
    });
  }

  return (
    <StudentPage
      title={`${career.title} roadmap`}
      description="Work through the skills in order and mark your progress as you go."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/careers/${encodeURIComponent(career.slug)}`}
            className="auth-link"
          >
            View career details
          </Link>
          <button
            type="button"
            className="catalog-button"
            disabled={save.pending}
            onClick={regenerate}
          >
            Regenerate roadmap
          </button>
        </div>
        <div className="space-y-2 border-y border-line py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted">
              {completedSteps} of {totalSteps} steps done
            </p>
            <p className="font-semibold tabular-nums text-accent">
              {progressPercent}% complete
            </p>
          </div>
          <progress
            aria-label="Roadmap completion"
            value={progressPercent}
            max={100}
            className="h-2 w-full appearance-none bg-accent/10 [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-accent/10 [&::-webkit-progress-value]:bg-accent"
          />
        </div>
        <SaveFeedback {...save} message={message} />
        {steps.length === 0 ? (
          <p className="text-sm font-semibold text-accent">
            This roadmap is complete. There are no remaining steps.
          </p>
        ) : (
          <ol>
            {steps.map((step) => (
              <RoadmapStep
                key={step.id}
                step={step}
                pending={save.pending}
                confirming={confirmStepId === step.id}
                onStatus={onStatus}
                onOffer={setConfirmStepId}
                onConfirm={onConfirm}
                onSkip={() => setConfirmStepId(null)}
              />
            ))}
          </ol>
        )}
      </div>
    </StudentPage>
  );
}

export default function RoadmapPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const load = useCallback(
    (signal) => getRoadmap(id, token, signal),
    [id, token],
  );
  const result = useRemoteData(load);
  return (
    <RemoteStatus {...result}>
      {result.data && <RoadmapEditor initial={result.data} token={token} />}
    </RemoteStatus>
  );
}
