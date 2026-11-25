export function createRoadmapController(service) {
  return {
    careers: async (_request, response) =>
      response.json({ data: await service.careers() }),
    career: async ({ validated }, response) =>
      response.json({ data: await service.career(validated.params.slug) }),
    gap: async ({ user, validated }, response) =>
      response.json({
        data: await service.gap(user.id, validated.params.careerId),
      }),
    generate: async ({ user, validated }, response) =>
      response.json({
        data: await service.generate(user.id, validated.params.careerId),
      }),
    list: async ({ user }, response) =>
      response.json({ data: await service.list(user.id) }),
    get: async ({ user, validated }, response) =>
      response.json({ data: await service.get(user.id, validated.params.id) }),
    updateStep: async ({ user, validated }, response) =>
      response.json({
        data: await service.updateStep(
          user.id,
          validated.params.stepId,
          validated.body.status,
        ),
      }),
    applyRating: async ({ user, validated }, response) =>
      response.json({
        data: await service.applyRating(user.id, validated.params.stepId),
      }),
  };
}
