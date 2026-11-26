import { useState } from 'react';

export default function PasswordInput({ label, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className="form-input pr-14"
      />
      <button
        type="button"
        aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        aria-controls={inputProps.id}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
          {visible && <path d="m4 4 16 16" />}
        </svg>
      </button>
    </div>
  );
}
