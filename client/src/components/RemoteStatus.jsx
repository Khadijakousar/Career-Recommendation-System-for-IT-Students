export default function RemoteStatus({ data, error, reload, children }) {
  if (error) {
    return (
      <div>
        <p role="alert" className="text-error">
          {error.status ? error.message : 'The service could not be reached.'}
        </p>
        <button type="button" className="catalog-button mt-3" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }
  if (!data)
    return (
      <p role="status" className="text-muted">
        Loading…
      </p>
    );
  return children;
}
