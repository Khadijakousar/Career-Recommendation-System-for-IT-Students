import { useState } from 'react';

export function useStudentSave(save) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  function clearFeedback() {
    setError(null);
    setSaved(false);
  }

  async function submit(data) {
    if (pending) return;
    setPending(true);
    clearFeedback();
    try {
      await save(data);
      setSaved(true);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  return { pending, error, saved, submit, clearFeedback };
}
