import { useState } from 'react';
import { changePassword, requestEmailVerification } from '../../api/auth.js';
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
  const { token, user, signOut } = useAuth();
  const [verification, setVerification] = useState(null);

  async function savePassword(values) {
    await changePassword(token, values);
    signOut('password-changed');
  }

  async function sendVerification() {
    setVerification({ pending: true });
    try {
      await requestEmailVerification(token);
      setVerification({ message: 'Check your inbox for a confirmation link.' });
    } catch (error) {
      setVerification({
        error: true,
        message: error.status
          ? error.message
          : 'The service could not be reached. Please try again.',
      });
    }
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
      <section
        className="mt-10 border-t border-line pt-6"
        aria-labelledby="recovery-email"
      >
        <h2 id="recovery-email" className="text-lg font-semibold">
          Recovery email
        </h2>
        <p className="mt-2 break-all text-sm text-muted">{user.email}</p>
        {user.emailVerifiedAt ? (
          <p className="mt-1 text-sm">Email confirmed</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Confirm this address to enable password recovery.
            </p>
            <button
              type="button"
              className="auth-link mt-3 text-sm"
              disabled={verification?.pending}
              onClick={sendVerification}
            >
              {verification?.pending ? 'Sending…' : 'Send confirmation link'}
            </button>
            {verification?.message && (
              <p
                role={verification.error ? 'alert' : 'status'}
                className={`mt-2 text-sm ${verification.error ? 'text-error' : 'text-accent'}`}
              >
                {verification.message}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
