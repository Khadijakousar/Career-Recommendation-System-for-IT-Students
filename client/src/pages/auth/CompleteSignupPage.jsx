import { Link, useLocation, useNavigate } from 'react-router-dom';
import { completeSignup } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';

const fields = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  {
    name: 'newPassword',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    hint: 'Use at least 8 characters.',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export default function CompleteSignupPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? '';

  return (
    <AuthLayout
      title="Finish signing up"
      description="Enter your name and choose a password."
    >
      {/^[a-f0-9]{64}$/.test(token) ? (
        <AuthForm
          fields={fields}
          submitLabel="Create account"
          onSubmit={async (values) => {
            await completeSignup({ ...values, token });
            navigate('/login', { replace: true, state: { registered: true } });
          }}
        />
      ) : (
        <p
          role="alert"
          className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm text-error"
        >
          This confirmation link is invalid. Request a new link to continue.
        </p>
      )}
      <Link to="/register" className="auth-link mt-5 inline-block text-sm">
        Request a new link
      </Link>
    </AuthLayout>
  );
}
