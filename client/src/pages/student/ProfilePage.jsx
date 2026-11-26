import { useCallback, useState } from 'react';
import { saveStudentProfile, studentProfile } from '../../api/student.js';
import FormField from '../../components/FormField.jsx';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { useStudentSave } from '../../hooks/useStudentSave.js';
import SaveFeedback from './SaveFeedback.jsx';
import StudentPage from './StudentPage.jsx';

const semesters = Array.from({ length: 8 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

function profileDraft(profile) {
  return {
    program: profile?.program ?? '',
    semester: profile?.semester ?? '',
    cgpa: profile?.cgpa ?? '',
    courses: profile?.completedCourses.join('\n') ?? '',
  };
}

export default function ProfilePage() {
  const { token } = useAuth();
  const load = useCallback((signal) => studentProfile(token, signal), [token]);
  const result = useRemoteData(load);

  return (
    <StudentPage
      title="Academic profile"
      description="Record your current program and semester. CGPA and completed courses are optional."
    >
      <RemoteStatus {...result}>
        {result.data && (
          <ProfileForm profile={result.data.profile} token={token} />
        )}
      </RemoteStatus>
    </StudentPage>
  );
}

function ProfileForm({ profile, token }) {
  const [draft, setDraft] = useState(() => profileDraft(profile));
  const save = useStudentSave(async (body) => {
    const updated = await saveStudentProfile(token, body);
    setDraft(profileDraft(updated));
  });
  const fields = save.error?.fields;
  const courseError =
    fields?.completedCourses ??
    Object.entries(fields ?? {}).find(([key]) =>
      key.startsWith('completedCourses.'),
    )?.[1];

  function change(field, value) {
    save.clearFeedback();
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    save.submit({
      program: draft.program,
      semester: draft.semester,
      cgpa: draft.cgpa === '' ? null : draft.cgpa,
      completedCourses: draft.courses
        .split('\n')
        .map((course) => course.trim())
        .filter(Boolean),
    });
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="max-w-xl space-y-5 border-t border-line pt-5"
    >
      <SaveFeedback {...save} message="Profile saved." />
      <fieldset disabled={save.pending} className="min-w-0 space-y-5">
        <legend className="sr-only">Academic details</legend>
        <FormField
          label="Program"
          value={draft.program}
          onChange={(value) => change('program', value)}
          error={fields?.program}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Semester"
            type="number"
            options={semesters}
            value={draft.semester}
            onChange={(value) => change('semester', value)}
            error={fields?.semester}
          />
          <FormField
            label="CGPA (optional)"
            type="number"
            min={0}
            max={4}
            step="0.01"
            optional
            value={draft.cgpa}
            onChange={(value) => change('cgpa', value)}
            error={fields?.cgpa}
          />
        </div>
        <FormField
          label="Completed courses (optional)"
          type="textarea"
          optional
          hint="Enter one course per line."
          value={draft.courses}
          onChange={(value) => change('courses', value)}
          error={courseError}
        />
      </fieldset>
      <button type="submit" className="auth-button" disabled={save.pending}>
        {save.pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
