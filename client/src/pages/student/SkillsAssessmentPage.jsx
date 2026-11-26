import { useCallback, useState } from 'react';
import { saveStudentSkills, studentSkills } from '../../api/student.js';
import FormField from '../../components/FormField.jsx';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

const levels = [
  'None',
  'Beginner',
  'Basic',
  'Intermediate',
  'Advanced',
  'Expert',
].map((label, value) => ({ value, label: `${value} · ${label}` }));

export default function SkillsAssessmentPage() {
  const { token } = useAuth();
  const load = useCallback((signal) => studentSkills(token, signal), [token]);
  const result = useRemoteData(load);

  return (
    <StudentPage
      title="Skills assessment"
      description="Rate each skill from 0 (None) to 5 (Expert), then save your ratings together."
    >
      <RemoteStatus {...result}>
        {result.data?.groups.length ? (
          <SkillsForm {...result.data} token={token} />
        ) : (
          <p className="border-y border-line py-5 text-muted">
            No skills are available yet.
          </p>
        )}
      </RemoteStatus>
    </StudentPage>
  );
}

function SkillsForm({ groups, ratings, token }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(ratings.map(({ skillId, level }) => [skillId, level])),
  );
  const [triedSave, setTriedSave] = useState(false);
  const skills = groups.flatMap((group) => group.skills);
  const indices = new Map(skills.map(({ id }, index) => [id, index]));
  const rated = skills.filter(({ id }) => draft[id] !== undefined).length;
  const save = useStudentSave((body) => saveStudentSkills(token, body));
  const fields = save.error?.fields;

  function submit(event) {
    event.preventDefault();
    setTriedSave(true);
    if (rated === skills.length)
      save.submit(skills.map(({ id }) => ({ skillId: id, level: draft[id] })));
  }

  return (
    <form noValidate onSubmit={submit}>
      <fieldset disabled={save.pending} className="min-w-0 space-y-7">
        <legend className="sr-only">Rate your skills</legend>
        {groups.map(({ category, skills: categorySkills }) => (
          <section key={category} className="border-t border-line pt-4">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {categorySkills.map(({ id, name }) => (
                <FormField
                  key={id}
                  label={name}
                  value={draft[id] ?? ''}
                  type="number"
                  options={levels}
                  placeholder="Select level"
                  error={
                    fields?.[`${indices.get(id)}.skillId`] ||
                    fields?.[`${indices.get(id)}.level`] ||
                    (triedSave && draft[id] === undefined
                      ? 'Select a level'
                      : undefined)
                  }
                  onChange={(level) => {
                    save.clearFeedback();
                    setDraft((current) => ({ ...current, [id]: level }));
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </fieldset>
      <div className="sticky bottom-0 mt-7 space-y-3 border-t border-line bg-paper py-4">
        {triedSave && rated < skills.length && (
          <p role="alert" className="text-sm text-error">
            Rate all skills before saving.
          </p>
        )}
        <SaveFeedback {...save} message="Skill ratings saved." />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {rated} of {skills.length} rated
          </p>
          <button type="submit" className="auth-button" disabled={save.pending}>
            {save.pending ? 'Saving…' : 'Save skill ratings'}
          </button>
        </div>
      </div>
    </form>
  );
}
