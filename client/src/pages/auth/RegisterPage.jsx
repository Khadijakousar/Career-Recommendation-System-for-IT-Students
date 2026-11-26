import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';

const fields = [
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    autoComplete: 'email',
  },
];

export default function RegisterPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout
      title="Create your student account"
      description="Confirm your email address to set up your account."
    >
      {sent ? (
        <div className="space-y-4">
          <p
            role="status"
            className="border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm"
          >
            Check your inbox for a link to finish signing up. If it doesn’t
            arrive, check spam or request another link.
          </p>
          <button
            type="button"
            className="auth-link text-sm"
            onClick={() => setSent(false)}
          >
            Request another link
          </button>
        </div>
      ) : (
        <AuthForm
          fields={fields}
          submitLabel="Send confirmation link"
          onSubmit={async (values) => {
            await register(values);
            setSent(true);
          }}
        />
      )}
      <p className="mt-6 text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
