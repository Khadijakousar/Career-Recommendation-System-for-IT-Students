import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';

const fields = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
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

export default function RegisterPage() {
  const navigate = useNavigate();

  async function createAccount(values) {
    await register(values);
    navigate('/login', { replace: true, state: { registered: true } });
  }

  return (
    <AuthLayout
      title="Create your student account"
      description="Use this account to save your assessments and learning progress."
    >
      <AuthForm
        fields={fields}
        submitLabel="Create account"
        onSubmit={createAccount}
      />
      <p className="mt-6 text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
