import { Link, useLocation } from 'react-router-dom';
import { login } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const fields = [
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const { state } = useLocation();

  return (
    <AuthLayout title="Sign in" description="Use your email and password.">
      {state?.registered && (
        <p
          role="status"
          className="mb-5 border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm text-accent"
        >
          Your account is ready. Sign in to get started.
        </p>
      )}
      <AuthForm
        fields={fields}
        submitLabel="Sign in"
        onSubmit={async (values) => signIn(await login(values))}
      />
      <p className="mt-6 text-sm text-muted">
        New student?{' '}
        <Link to="/register" className="auth-link">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
