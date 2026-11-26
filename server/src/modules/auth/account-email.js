const messages = {
  signup: {
    path: '/complete-signup',
    subject: 'Confirm your student signup',
    instruction: 'Follow this link to finish creating your student account.',
  },
  verify: {
    path: '/verify-email',
    subject: 'Confirm your account email address',
    instruction:
      'Follow this link and enter your current password to confirm your email.',
  },
  reset: {
    path: '/reset-password',
    subject: 'Reset your career recommendation account password',
    instruction: 'Follow this link to choose a new password.',
  },
};

export function createAccountEmailSender({ apiKey, from, clientUrl }) {
  if (!apiKey || !from) return undefined;

  return async (email, token, purpose) => {
    const { path, subject, instruction } = messages[purpose];
    const link = new URL(path, clientUrl);
    link.hash = new URLSearchParams({ token }).toString();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text: `${instruction} The link expires in 30 minutes.\n\n${link}\n\nIf you did not make this request, you can ignore this email.`,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });

    await response.body?.cancel();
    if (!response.ok)
      throw new Error('The email provider rejected the request.');
  };
}
