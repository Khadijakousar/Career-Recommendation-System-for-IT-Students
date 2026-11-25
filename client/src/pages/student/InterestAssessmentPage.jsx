import { useCallback, useState } from 'react';
import { saveStudentInterests, studentInterests } from '../../api/student.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

export default function InterestAssessmentPage() {
  const { token } = useAuth();
  const load = useCallback(
    (signal) => studentInterests(token, signal),
    [token],
  );
  const result = useRemoteData(load);

  return (
    <StudentPage
      title="Interest assessment"
      description="Choose the option that best reflects what you enjoy for each question."
    >
      <RemoteStatus {...result}>
        {result.data?.questions.length ? (
          <InterestForm {...result.data} token={token} />
        ) : (
          <p className="border-y border-line py-5 text-muted">
            No questions are available yet.
          </p>
        )}
      </RemoteStatus>
    </StudentPage>
  );
}

function InterestForm({ questions, answers, token }) {
  const [draft, setDraft] = useState(() => {
    const saved = new Map(
      answers.map(({ questionId, optionId }) => [questionId, optionId]),
    );
    return Object.fromEntries(
      questions.flatMap(({ id, options }) =>
        options.some(({ id: optionId }) => optionId === saved.get(id))
          ? [[id, saved.get(id)]]
          : [],
      ),
    );
  });
  const [index, setIndex] = useState(() => {
    const firstUnanswered = questions.findIndex(({ id }) => !draft[id]);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const question = questions[index];
  const count = Object.keys(draft).length;
  const complete = count === questions.length;
  const save = useStudentSave(async (body) => {
    try {
      await saveStudentInterests(token, body);
    } catch (error) {
      const field = Object.keys(error.fields ?? {}).find((path) =>
        /^\d+\.optionId$/.test(path),
      );
      if (field) setIndex(Number(field.split('.')[0]));
      throw error;
    }
  });
  const answerError = save.error?.fields?.[`${index}.optionId`];

  function submit(event) {
    event.preventDefault();
    if (complete)
      save.submit(
        questions.map(({ id }) => ({ questionId: id, optionId: draft[id] })),
      );
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-xl space-y-5 border-t border-line pt-5"
    >
      <SaveFeedback {...save} message="Interest answers saved." />
      <div>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
          <p>
            Question {index + 1} of {questions.length}
          </p>
          <p>{count} answered</p>
        </div>
        <progress
          aria-label="Questions answered"
          value={count}
          max={questions.length}
          className="mt-2 h-2 w-full appearance-none bg-accent/10 [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-accent/10 [&::-webkit-progress-value]:bg-accent"
        />
      </div>
      <fieldset
        key={question.id}
        disabled={save.pending}
        className="min-w-0 space-y-2"
        aria-describedby={answerError ? 'answer-error' : undefined}
      >
        <legend className="mb-3 font-display text-2xl leading-tight">
          {question.text}
        </legend>
        {answerError && (
          <p id="answer-error" className="text-sm text-error">
            {answerError}
          </p>
        )}
        {question.options.map(({ id, text }) => (
          <label
            key={id}
            className="flex min-h-11 cursor-pointer items-center gap-3 border border-line px-3 py-2 text-sm hover:bg-accent/5 has-checked:border-accent has-checked:bg-accent/8"
          >
            <input
              type="radio"
              name="answer"
              value={id}
              checked={draft[question.id] === id}
              className="size-4 shrink-0 accent-accent focus-visible:outline-accent"
              onChange={() => {
                save.clearFeedback();
                setDraft((current) => ({ ...current, [question.id]: id }));
              }}
            />
            {text}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <button
          type="button"
          className="catalog-button"
          disabled={index === 0 || save.pending}
          onClick={() => setIndex(index - 1)}
        >
          Previous
        </button>
        {index < questions.length - 1 && (
          <button
            type="button"
            className={complete ? 'catalog-button' : 'auth-button'}
            disabled={!draft[question.id] || save.pending}
            onClick={() => setIndex(index + 1)}
          >
            Next
          </button>
        )}
        {(complete || index === questions.length - 1) && (
          <button
            type="submit"
            className="auth-button"
            disabled={!complete || save.pending}
          >
            {save.pending ? 'Saving…' : 'Save answers'}
          </button>
        )}
      </div>
    </form>
  );
}
