import { useEffect, useState } from 'react';

const loading = { data: null, error: null };

export function useRemoteData(load) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(loading);

  useEffect(() => {
    const controller = new AbortController();
    setResult(loading);
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ data, error: null });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ data: null, error });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  return { ...result, reload: () => setAttempt((current) => current + 1) };
}
