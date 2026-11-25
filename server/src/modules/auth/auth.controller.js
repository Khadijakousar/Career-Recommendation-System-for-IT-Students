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
  };
}
