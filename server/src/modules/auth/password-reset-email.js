export function createPasswordResetSender({ apiKey, from, clientUrl }) {
  if (!apiKey || !from) return undefined;

  return async (email, token) => {
    const link = new URL('/reset-password', clientUrl);
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
        subject: 'Reset your career recommendation account password',
        text: `Use this link to choose a new password within 30 minutes:\n\n${link}\n\nIf you did not request a reset, you can ignore this email.`,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });

    await response.body?.cancel();
    if (!response.ok)
      throw new Error('The email provider rejected the request.');
  };
}
