import { changePassword } from '../../api/auth.js';
import AuthForm from '../../components/AuthForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const fields = [
  {
    name: 'currentPassword',
    label: 'Current password',
    type: 'password',
    autoComplete: 'current-password',
  },
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

export default function ChangePasswordPage() {
  const { token, signOut } = useAuth();

  async function savePassword(values) {
    await changePassword(token, values);
    signOut('password-changed');
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        Change password
      </h1>
      <p className="mt-3 text-muted">
        Changing your password signs you out on all devices.
      </p>
      <div className="mt-7">
        <AuthForm
          fields={fields}
          submitLabel="Save new password"
          onSubmit={savePassword}
        />
      </div>
    </div>
  );
}
