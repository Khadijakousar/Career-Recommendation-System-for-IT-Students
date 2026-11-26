export function createAuthController(authService) {
  return {
    async register(request, response) {
      const user = await authService.register(request.validated.body);
      response.status(201).json({ data: { user } });
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
      // Complete the HTTP response without waiting for account lookup or email delivery.
      response.status(202).json({ data: {} });
      void authService
        .requestPasswordReset(request.validated.body)
        .catch(() => {
          console.error('Password reset email could not be issued.');
        });
    },

    async resetPassword(request, response) {
      await authService.resetPassword(request.validated.body);
      response.status(204).end();
    },
  };
}
