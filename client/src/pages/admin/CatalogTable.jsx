export default function CatalogTable({
  config,
  items,
  onEdit,
  onRemove,
  onRequirements,
}) {
  if (!items.length)
    return (
      <p className="border-y border-line py-6 text-sm text-muted">
        No {config.title.toLowerCase()} to show.
      </p>
    );

  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <thead className="border-y border-line bg-accent/5 text-muted">
        <tr>
          {config.columns.map((label, index) => (
            <th
              scope="col"
              key={label}
              className={`p-3 font-semibold ${index ? 'hidden lg:table-cell' : ''}`}
            >
              {label}
            </th>
          ))}
          <th scope="col" className="w-[46%] p-3 font-semibold sm:w-52">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line border-b border-line">
        {items.map((item) => {
          const [name, ...details] = config.describe(item);
          return (
            <tr key={item.id} className="align-top">
              <th scope="row" className="wrap-anywhere p-3 font-semibold">
                {name}
                {details.length > 0 && (
                  <span className="mt-1 block text-xs font-normal text-muted lg:hidden">
                    {details.join(' · ')}
                  </span>
                )}
              </th>
              {details.map((detail, index) => (
                <td
                  key={config.columns[index + 1]}
                  className="hidden wrap-anywhere p-3 text-muted lg:table-cell"
                >
                  {detail}
                </td>
              ))}
              <td className="p-3">
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  <button
                    type="button"
                    className="auth-link min-h-8"
                    aria-label={`Edit ${name}`}
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                  {onRequirements && (
                    <button
                      type="button"
                      className="auth-link min-h-8"
                      aria-label={`Required skills for ${name}`}
                      onClick={() => onRequirements(item)}
                    >
                      Skills
                    </button>
                  )}
                  <button
                    type="button"
                    className="auth-link min-h-8 text-error"
                    aria-label={`Delete ${name}`}
                    onClick={() => onRemove(item)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
