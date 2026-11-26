import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';

const fields = [
  {
    name: 'password',
    label: 'Current password',
    type: 'password',
    autoComplete: 'current-password',
  },
];

export default function VerifyEmailPage() {
  const { hash, state } = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? '';

  return (
    <AuthLayout
      title="Confirm your email"
      description={
        state?.verified
          ? 'You can now reset your password by email.'
          : 'Enter your current password to confirm this address.'
      }
    >
      {state?.verified ? (
        <p
          role="status"
          className="border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm"
        >
          Your email address is confirmed.
        </p>
      ) : /^[a-f0-9]{64}$/.test(token) ? (
        <AuthForm
          fields={fields}
          submitLabel="Confirm email address"
          onSubmit={async (values) => {
            await verifyEmail({ ...values, token });
            navigate('/verify-email', {
              replace: true,
              state: { verified: true },
            });
          }}
        />
      ) : (
        <p
          role="alert"
          className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm text-error"
        >
          This confirmation link is invalid. Sign in to request a new link from
          your account.
        </p>
      )}
      <Link
        to="/login"
        reloadDocument
        className="auth-link mt-5 inline-block text-sm"
      >
        Return to sign in
      </Link>
    </AuthLayout>
  );
}
