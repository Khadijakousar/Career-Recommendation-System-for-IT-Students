export function createAdminController(service) {
  return {
    list: (config) => async (request, response) => {
      response.json({
        data: await service.list(config, request.validated.query),
      });
    },
    get: (config) => async (request, response) => {
      response.json({
        data: await service.get(config, request.validated.params.id),
      });
    },
    save:
      (config, create = false) =>
      async (request, response) => {
        const { body, params } = request.validated;
        response
          .status(create ? 201 : 200)
          .json({ data: await service.save(config, body, params.id) });
      },
    remove: (config) => async (request, response) => {
      await service.remove(config, request.validated.params.id);
      response.sendStatus(204);
    },
    async replaceRequirements(request, response) {
      const { params, body } = request.validated;
      response.json({
        data: await service.replaceRequirements(params.id, body),
      });
    },
    async stats(_request, response) {
      response.json({ data: await service.stats() });
    },
  };
}
