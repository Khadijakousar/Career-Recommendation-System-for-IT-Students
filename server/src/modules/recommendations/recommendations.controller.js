export function createRecommendationController(service) {
  return {
    async latest({ user }, response) {
      response.json({ data: await service.latest(user.id) });
    },
    async generate({ user }, response) {
      response.status(201).json({ data: await service.generate(user.id) });
    },
  };
}
