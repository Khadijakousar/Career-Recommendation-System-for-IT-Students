export default function SaveFeedback({ error, saved, message }) {
  if (error) {
    return (
      <p
        role="alert"
        className="border-l-2 border-error bg-error/5 p-3 text-sm text-error"
      >
        {error.status
          ? error.message
          : 'The service could not be reached. Try saving again.'}
      </p>
    );
  }
  if (saved) {
    return (
      <p
        role="status"
        className="border-l-2 border-accent bg-accent/5 p-3 text-sm text-accent"
      >
        {message}
      </p>
    );
  }
  return null;
}
