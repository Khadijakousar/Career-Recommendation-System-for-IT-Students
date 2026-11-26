import { useState } from 'react';
import PasswordInput from './PasswordInput.jsx';

export default function AuthForm({ fields, submitLabel, onSubmit }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;

    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError(null);

    try {
      await onSubmit(values);
    } catch (failure) {
      setError(
        failure.status
          ? failure
          : { message: 'The service could not be reached. Please try again.' },
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p
          role="alert"
          className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm text-error"
        >
          {error.message}
        </p>
      )}
      {fields.map(({ name, label, type = 'text', autoComplete, hint }) => {
        const fieldError = error?.fields?.[name];
        const details = fieldError || hint;
        const inputProps = {
          id: name,
          name,
          autoComplete,
          required: true,
          'aria-invalid': fieldError ? true : undefined,
          'aria-describedby': details ? `${name}-details` : undefined,
        };

        return (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-semibold">
              {label}
            </label>
            {type === 'password' ? (
              <PasswordInput {...inputProps} label={label} />
            ) : (
              <input {...inputProps} type={type} className="form-input" />
            )}
            {details && (
              <p
                id={`${name}-details`}
                className={`mt-1 text-sm ${fieldError ? 'text-error' : 'text-muted'}`}
              >
                {details}
              </p>
            )}
          </div>
        );
      })}
      <button type="submit" className="auth-button w-full" disabled={pending}>
        {pending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
