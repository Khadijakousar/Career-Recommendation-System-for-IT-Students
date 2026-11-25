export function createDashboardController(service) {
  return async ({ user }, response) => {
    response.json({ data: await service.get(user.id) });
  };
}
