import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/auth.js';
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

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <AuthLayout
      title="Forgot password"
      description="Enter the email address you use to sign in."
    >
      {submitted ? (
        <p
          role="status"
          className="border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm"
        >
          If an account matches that email, a reset link will arrive shortly.
          Check your spam folder if you don’t see it.
        </p>
      ) : (
        <AuthForm
          fields={fields}
          submitLabel="Send reset link"
          onSubmit={async (values) => {
            await requestPasswordReset(values);
            setSubmitted(true);
          }}
        />
      )}
      <Link to="/login" className="auth-link mt-5 inline-block text-sm">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
