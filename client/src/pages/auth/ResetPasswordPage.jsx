import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const fields = [
  {
    name: 'newPassword',
    label: 'New password',
    type: 'password',
    autoComplete: 'new-password',
    hint: 'Use at least 8 characters.',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm new password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export default function ResetPasswordPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? '';
  const hasToken = /^[a-f0-9]{64}$/.test(token);

  async function savePassword(values) {
    await resetPassword({ ...values, token });
    signOut('password-changed');
    navigate('/login', { replace: true });
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Choose a new password for your account."
    >
      {hasToken ? (
        <AuthForm
          fields={fields}
          submitLabel="Save new password"
          onSubmit={savePassword}
        />
      ) : (
        <p
          role="alert"
          className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm text-error"
        >
          This reset link is invalid. Request a new link to continue.
        </p>
      )}
      <Link
        to="/forgot-password"
        className="auth-link mt-5 inline-block text-sm"
      >
        Request a new link
      </Link>
    </AuthLayout>
  );
}
