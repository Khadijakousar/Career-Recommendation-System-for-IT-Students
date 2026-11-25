export function createStudentController(service) {
  return {
    profile: async ({ user }, response) =>
      response.json({ data: await service.profile(user.id) }),
    saveProfile: async ({ user, validated }, response) =>
      response.json({
        data: await service.saveProfile(user.id, validated.body),
      }),
    skillCatalog: async (_request, response) =>
      response.json({ data: await service.skillCatalog() }),
    ratings: async ({ user }, response) =>
      response.json({ data: await service.ratings(user.id) }),
    saveRatings: async ({ user, validated }, response) =>
      response.json({
        data: await service.saveRatings(user.id, validated.body),
      }),
    interestQuestions: async (_request, response) =>
      response.json({ data: await service.interestQuestions() }),
    answers: async ({ user }, response) =>
      response.json({ data: await service.answers(user.id) }),
    saveAnswers: async ({ user, validated }, response) =>
      response.json({
        data: await service.saveAnswers(user.id, validated.body),
      }),
  };
}
