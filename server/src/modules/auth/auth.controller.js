function acceptEmailRequest(response, send) {
  // Complete the response independently of account lookup and email delivery.
  response.status(202).json({ data: {} });
  void send().catch(() => console.error('Account email could not be issued.'));
}

export function createAuthController(authService, verificationService) {
  return {
    register(request, response) {
      acceptEmailRequest(response, () =>
        verificationService.register(request.validated.body),
      );
    },

    async completeSignup(request, response) {
      await verificationService.completeSignup(request.validated.body);
      response.status(204).end();
    },

    requestVerification(request, response) {
      acceptEmailRequest(response, () =>
        verificationService.requestVerification(request.user.id),
      );
    },

    async verifyEmail(request, response) {
      await verificationService.verifyEmail(request.validated.body);
      response.status(204).end();
    },

    async login(request, response) {
      const session = await authService.login(request.validated.body);
      response.json({ data: session });
    },

    me(request, response) {
      response.json({ data: { user: request.user } });
    },

    async changePassword(request, response) {
      await authService.changePassword(
        request.user.id,
        request.sessionVersion,
        request.validated.body,
      );
      response.status(204).end();
    },

    requestPasswordReset(request, response) {
      acceptEmailRequest(response, () =>
        authService.requestPasswordReset(request.validated.body),
      );
    },

    async resetPassword(request, response) {
      await authService.resetPassword(request.validated.body);
      response.status(204).end();
    },
  };
}
