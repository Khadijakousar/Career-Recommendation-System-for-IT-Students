import { useId } from 'react';

export default function FormField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  optional,
  hint,
  error,
  min,
  max,
  step,
  placeholder = 'Select an option',
}) {
  const id = useId();
  const details = error || hint;
  const attributes = {
    id,
    required: !optional,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': details ? `${id}-details` : undefined,
  };
  const change = (event) => {
    const next = event.target.value;
    onChange(type === 'number' && next !== '' ? Number(next) : next);
  };

  if (type === 'checkbox') {
    return (
      <label
        htmlFor={id}
        className="flex w-fit items-center gap-3 py-2 text-sm font-semibold"
      >
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-accent"
        />
        {label}
      </label>
    );
  }

  const inputProps = {
    ...attributes,
    value,
    onChange: change,
    className: 'form-input',
  };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {options ? (
        <select {...inputProps}>
          <option value="" disabled={!optional}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...inputProps} rows={3} />
      ) : (
        <input {...inputProps} type={type} min={min} max={max} step={step} />
      )}
      {details && (
        <p
          id={`${id}-details`}
          className={`mt-1 text-sm ${error ? 'text-error' : 'text-muted'}`}
        >
          {details}
        </p>
      )}
    </div>
  );
}
